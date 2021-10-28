/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import WordFinder from './wordfinder';
import { createElementFromHtml, openXmlHttpRequest } from '../modules/util';

/**
 * Enables auto-linking and formatting on GitHub specific auto-linkable text present
 * in the content, like #issues, @people and commit hashes.
 */
export default class AutoLinkGitHub extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ WordFinder ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const wordFinder = editor.wordFinder;

		// Get the list of features to be enabled.
		const config = editor.config.get( 'githubWriter.autoLinking' ) || {};

		{
			// @user-name
			// @organization/user-name
			config.person && wordFinder.add( {
				type: 'person',
				pattern: /@(?:[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+(?:\/[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+)?)/i,
				callback: matchCallback,
				conversion: {
					'editingDowncast': () => 'autolink'
				}
			} );

			// #1
			// mojombo#1
			// mojombo/github-flavored-markdown#1
			config.issue && wordFinder.add( {
				type: 'issue',
				pattern: /(?:[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+(?:\/[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+)?)?#\d+/i,
				callback: matchCallback,
				conversion: {
					'editingDowncast': /* istanbul ignore next - overridden by urlGitHub/issue */ () => 'autolink'
				}
			} );

			// 16c999e8c71134401a78d4d46435517b2271d6ac
			// mojombo@16c999e8c71134401a78d4d46435517b2271d6ac
			// mojombo/github-flavored-markdown@16c999e8c71134401a78d4d46435517b2271d6ac
			config.sha && wordFinder.add( {
				type: 'sha',
				pattern: /(?:[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+(?:\/[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+)?@)?[a-f\d]{7,40}/i,
				callback: matchCallback,
				conversion: {
					'editingDowncast': /* istanbul ignore next - overridden by urlGitHub/sha */ () => 'autolink'
				}
			} );

			// GitHub urls
			config.urlGitHub && config.issue && wordFinder.add( {
				type: 'issue',
				pattern: /https:\/\/github\.com\/.*\/(?:issues|pull)\/[^\s]+?/i,
				callback: matchCallback,
				conversion: {
					'editingDowncast': () => 'autolink'
				}
			} );
			config.urlGitHub && config.sha && wordFinder.add( {
				type: 'sha',
				pattern: /https:\/\/github\.com\/.*\/commit\/[^\s]+?/i,
				callback: matchCallback,
				conversion: {
					'editingDowncast': () => 'autolink'
				}
			} );
		}

		// this.editor.conversion.for( 'editingDowncast' ).wordToElement( {
		// 	type: [ 'person', 'issue', 'sha' ],
		// 	view: { name: 'autolink', attributes: { spellcheck: false } }
		// } );

		// This is the class instance that will be used to retrieve and cache additional information about the GitHub links.
		// This extra information will be used by GH itself to show the hover cards of the links.
		const linkDataLoader = new GitHubLinkDataLoader();

		/**
		 * The callback called whenever a GitHub auto-linking pattern is found.
		 *
		 * @param match {Object} The text match information.
		 * @returns {Promise|boolean} "false" to not auto-link, a promise that resolves with the list of attributes
		 * or anything else to confirm the auto-link.
		 */
		function matchCallback( match ) {
			// Take the link data for the matched text.
			return linkDataLoader.load( match.text )
				.then( linkData => {
					// If this is a valid GH url, update the match info.
					if ( linkData ) {
						match.text = linkData.text;
						Object.assign( match.data, linkData.data );
					}
					return !!linkData;
				} );
		}
	}
}

/**
 * Checks if a piece of text is a GitHub auto-link and download extra data about it in such case.
 */
export class GitHubLinkDataLoader {
	/**
	 * Gets the url information of the GitHub preview creator.
	 *
	 * @return {{url: String, token: String}} The url information.
	 */
	getPreviewUrlInfo() {
		if ( !this._urlInfo ) {
			// Everything is available in the dom.
			const urlElement = document.querySelector( '[data-preview-url]' );
			const tokenElement = urlElement && urlElement.querySelector( 'input.js-data-preview-url-csrf' );

			if ( tokenElement ) {
				this._urlInfo = {
					url: urlElement.getAttribute( 'data-preview-url' ),
					token: tokenElement.value
				};
			} else {
				console.error( 'GitHub Writer error: could not retrieve the preview url.' );
			}
		}

		return this._urlInfo;
	}

	/**
	 * Checks a text for auto-linking and returns its extra data, if any.
	 * If not a valid GH link, it resolves to `false`.
	 *
	 * @param text The text to be checked.
	 * @return {Promise} A promise that resolves to extra data or to `false`.
	 */
	load( text ) {
		return new Promise( resolve => {
			// Get the GitHub preview for this text.
			downloadPreview.call( this )
				.then( container => {
					// If a link is returned, then auto-link is available for this text.
					const link = container.querySelector( 'a' );
					let linkData;

					if ( link ) {
						const returnedText = link.textContent;

						// Get the extra data from the link itself.
						linkData = {
							// GitHub may have a different text for this as well. e.g. when pasting an issue url.
							// Ignore the returned text if it contains space (it's not a single word).
							text: /\s/.test( returnedText ) ? text : returnedText,

							data: {
								url: link.getAttribute( 'href' ),

								// This enables hover cards on the auto-link.
								'hovercard-type': link.getAttribute( 'data-hovercard-type' ),
								'hovercard-url': link.getAttribute( 'data-hovercard-url' )
							}
						};
					} else {
						// No link, so disable auto-linking.
						linkData = false;
					}

					resolve( linkData );
				} )
				.catch( err => {
					if ( err ) {
						console.error( err );
					}
					resolve( false );
				} );
		} );

		/**
		 * Gets a promise that resolves with the html returned by the preview feature of GitHub.
		 *
		 * @return {Promise<String>} A promise that resolves to the html returned.
		 */
		function downloadPreview() {
			return new Promise( ( resolve, reject ) => {
				// Get the url information from the dom.
				// noinspection JSPotentiallyInvalidUsageOfClassThis
				const urlInfo = this.getPreviewUrlInfo();

				const xhr = openXmlHttpRequest( urlInfo.url );

				xhr.addEventListener( 'error', () => reject(
					new Error( `Error loading preview for auto-linking from ${ urlInfo.url }.` ) ) );
				xhr.addEventListener( 'abort', () => reject() );
				xhr.addEventListener( 'load', () => {
					resolve( createElementFromHtml( `<div>${ xhr.response }</div>` ) );
				} );

				const data = new FormData();
				// Just send the text and GitHub will give the preview back for it.
				data.append( 'text', text );
				data.append( 'authenticity_token', urlInfo.token );

				xhr.send( data );
			} );
		}
	}
}
