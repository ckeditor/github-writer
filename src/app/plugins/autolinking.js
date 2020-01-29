/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import TreeWalker from '@ckeditor/ckeditor5-engine/src/model/treewalker';
import Range from '@ckeditor/ckeditor5-engine/src/model/range';
import LiveRange from '@ckeditor/ckeditor5-engine/src/model/liverange';
import { createElementFromHtml } from '../util';

export default class AutoLinking extends Plugin {
	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const model = editor.model;
		const linkDataLoader = new LinkDataLoader();

		let config = this.editor.config.get( 'githubRte.autoLinking' );

		config = config.map( entry => ( {
			regex: new RegExp( `^([("']*?)(${ entry.pattern.source })(?=[.,)?! ]*$)`, entry.pattern.flags ),
			type: entry.type
		} ) );

		editor.model.schema.extend( '$text', { allowAttributes: 'autolink' } );
		editor.model.schema.setAttributeProperties( 'autolink', {
			isFormatting: false,
			copyOnEnter: false
		} );

		editor.conversion.for( 'editingDowncast' ).attributeToElement( {
			model: 'autolink',
			view: ( modelValue, viewWriter ) => {
				return createViewElement( modelValue, viewWriter );
			}
		} );

		function createViewElement( data, writer ) {
			const attribs = {};

			if ( data ) {
				attribs[ 'data-type' ] = data.type;
				attribs[ 'data-text' ] = data.text;
				attribs[ 'data-autolink' ] = data.enabled ? 'true' : 'false';
				attribs.spellcheck = 'false';

				if ( data.enabled ) {
					if ( data.hovercard ) {
						attribs[ 'data-hovercard-type' ] = data.hovercard.type;
						attribs[ 'data-hovercard-url' ] = data.hovercard.url;
					}
				}
			}

			return writer.createAttributeElement( 'github-rte-autolink', data && attribs );
		}

		model.document.on( 'change:data', ( evt, batch ) => {
			if ( batch.type === 'transparent' ) {
				return;
			}

			checkTexts( getTextsToCheck() );

			function getTextsToCheck() {
				const changes = model.document.differ.getChanges();
				let wasTextRemoved, isTextChange;
				const textFinder = new TextFinder();

				changes.forEach( change => {
					switch ( change.type ) {
						case 'attribute':
							textFinder.findAtPosition( change.range.start );
							textFinder.findAtPosition( change.range.end );
							break;
						case 'insert':
						case 'remove':
							textFinder.findAtPosition( change.position );

							isTextChange = change.name === '$text';

							if ( change.type === 'insert' ) {
								textFinder.findAtPosition( change.position.getShiftedBy( change.length ) );

								if ( !isTextChange && wasTextRemoved ) {
									// Take the inserted element.
									const node = change.position.nodeAfter;
									if ( node ) {
										// We want to check text that is at the beginning and the end of the element.
										textFinder.findAtPosition( model.createPositionAt( node, 0 ) );
									}
								}
							} else if ( isTextChange ) {
								wasTextRemoved = true;
							}
							break;
					}
				} );

				return textFinder.texts;
			}

			function checkTexts( texts ) {
				model.enqueueChange( 'transparent', writer => {
					texts.forEach( ( { text, range } ) => {
						const matched = config.find( ( { regex, type } ) => {
							const match = text.match( regex );

							if ( match ) {
								const text = match[ 2 ];
								const index = match[ 1 ].length;
								const length = match[ 2 ].length;
								const matchRange = new Range(
									range.start.getShiftedBy( index ),
									range.start.getShiftedBy( index + length )
								);

								// Remove autolink from the parts of the range we'll not be touching.
								range.getDifference( matchRange ).forEach( excludedRange => {
									writer.removeAttribute( 'autolink', excludedRange );
								} );

								const attribs = { type, text };
								const linkData = linkDataLoader.load( type, text );

								if ( linkData ) {
									if ( linkData instanceof Promise ) {
										const liveMatchRange = LiveRange.fromRange( matchRange );
										linkData.then( () => {
											const textFinder = new TextFinder();
											textFinder.findAtPosition( liveMatchRange.start );
											textFinder.findAtPosition( liveMatchRange.end );

											liveMatchRange.detach();

											checkTexts( textFinder.texts );
										} );
									} else {
										linkData.hovercard && ( attribs.hovercard = linkData.hovercard );
									}
								}

								attribs.enabled = ( linkData !== false );

								if ( !linkData || linkData instanceof Promise || linkData.text === text ) {
									writer.setAttribute( 'autolink', attribs, matchRange );
								} else {
									writer.remove( matchRange );
									writer.insertText( linkData.text, { autolink: attribs }, matchRange.start );

									const textFinder = new TextFinder();
									textFinder.findAtPosition( matchRange.start );
									checkTexts( textFinder.texts );
								}

								return true;
							}
						} );

						// If nothing has been matched, clean up the range from autolink.
						if ( !matched ) {
							writer.removeAttribute( 'autolink', range );
						}
					} );
				} );
			}
		} );

		model.document.selection.on( 'change:range', checkSelection );
		model.document.selection.on( 'change:attribute', checkSelection );

		function checkSelection() {
			const selection = model.document.selection;
			if ( selection.hasAttribute( 'autolink' ) ) {
				const pos = selection.anchor;
				if ( !pos.textNode ) {
					model.change( writer => {
						writer.removeSelectionAttribute( 'autolink' );
					} );
				}
			}
		}
	}
}

class TextFinder {
	constructor() {
		this.texts = [];
	}

	findAtPosition( pos ) {
		let startPos, endPos;
		{
			const walker = new TreeWalker( {
				direction: 'backward',
				startPosition: pos,
				singleCharacters: true
			} );
			walker.skip( value => {
				return value.type === 'text' && value.item.data !== ' ';
			} );

			startPos = walker.position;
		}

		{
			const walker = new TreeWalker( {
				direction: 'forward',
				startPosition: pos,
				singleCharacters: true
			} );
			walker.skip( value => {
				return value.type === 'text' && value.item.data !== ' ';
			} );

			endPos = walker.position;
		}

		if ( !startPos.isEqual( endPos ) ) {
			const range = new Range( startPos, endPos );

			if ( !this.texts.find( item => {
				return item.range.isEqual( range );
			} ) ) {
				this.texts.push( {
					text: Array.from( range.getItems() )
						.reduce( ( output, item ) => ( output + item.data ), '' ),
					range
				} );
			}
		}
	}
}

class LinkDataLoader {
	constructor() {
		this.cache = {};
	}

	getPreviewUrlInfo() {
		if ( !this._urlInfo ) {
			const urlElement = document.querySelector( '[data-preview-url]' );
			const tokenElement = urlElement && urlElement.querySelector( 'input.js-data-preview-url-csrf' );

			if ( tokenElement ) {
				this._urlInfo = {
					url: urlElement.getAttribute( 'data-preview-url' ),
					token: tokenElement.value
				};
			}
		}

		return this._urlInfo;
	}

	load( type, text ) {
		const key = type + ':' + text;
		if ( !this.cache.hasOwnProperty( key ) ) {
			const checkPreview =
				type === 'issue' ||
				type === 'sha' ||
				type === 'person' ||
				( type === 'url' && /^https:\/\/github.com\//i.test( text ) );

			if ( checkPreview ) {
				// TODO: handle promise rejection.
				this.cache[ key ] = new Promise( resolve => {
					return downloadPreview.call( this )
						.then( container => {
							const link = container.querySelector( 'a' );
							let linkData;

							if ( link ) {
								linkData = {
									url: link.getAttribute( 'href' ),
									text: link.textContent,
									hovercard: {
										type: link.getAttribute( 'data-hovercard-type' ),
										url: link.getAttribute( 'data-hovercard-url' )
									}
								};

								if ( linkData.text !== text ) {
									this.cache[ type + ':' + linkData.text ] = linkData;
								}
							} else {
								linkData = false;
							}

							// The cache now points to the data itself, not to the promise anymore.
							this.cache[ key ] = linkData;

							resolve( linkData );
						} );
				} );
			} else {
				this.cache[ key ] = { text };
			}
		}

		return this.cache[ key ];

		function downloadPreview() {
			return new Promise( ( resolve, reject ) => {
				// noinspection JSPotentiallyInvalidUsageOfClassThis
				const urlInfo = this.getPreviewUrlInfo();

				const xhr = new XMLHttpRequest();
				xhr.open( 'POST', urlInfo.url, true );

				// It doesn't work without this one.
				xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );

				xhr.addEventListener( 'error', () => reject(
					new Error( `Error loading preview for auto-linking from ${ urlInfo.url }.` ) ) );
				xhr.addEventListener( 'abort', () => reject() );
				xhr.addEventListener( 'load', () => {
					resolve( createElementFromHtml( `<div>${ xhr.response }</div>` ) );
				} );

				const data = new FormData();
				data.append( 'text', text );
				data.append( 'authenticity_token', urlInfo.token );

				xhr.send( data );
			} );
		}
	}
}
