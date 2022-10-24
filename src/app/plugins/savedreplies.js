/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import FilteredListView from '../modules/filteredlistview';

import { createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import icon from '../icons/savedreplies.svg';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import { openXmlHttpRequest } from '../modules/util';
import ListFilter from '../modules/listfilter';

export default class SavedReplies extends Plugin {
	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const url = editor.config.get( 'githubWriter.savedReplies.url' );

		// Register the 'savedreplies' component, a dropdown.
		editor.ui.componentFactory.add( 'savedReplies', locale => {
			const dropdown = createDropdown( locale );

			dropdown.class = 'github-writer-saved-replies-button';
			dropdown.panelPosition = 'sw';

			dropdown.buttonView.set( {
				label: 'Insert a reply',
				icon,
				// The tooltipped tooltipped-n (north) classes enable the GH tooltip.
				class: 'tooltipped tooltipped-n'
			} );

			dropdown.buttonView.extendTemplate( {
				attributes: {
					// The GH tooltip text is taken from aria-label.
					'aria-label': 'Insert a reply'
				}
			} );

			const repliesList = new RepliesListView( editor.locale, url );
			repliesList.on( 'reply', ( evt, body ) => insertReply( body ) );

			dropdown.panelView.children.add( repliesList );

			// Register `Ctrl+.' to open the dropdown.
			editor.keystrokes.set( [ 'ctrl', 190 ], ( data, cancel ) => {
				dropdown.isOpen = true;
				cancel();
			} );

			return dropdown;

			function insertReply( replyMarkdown ) {
				// Creates a model fragment out of the markdown received.
				const viewFragment = editor.data.processor.toView( replyMarkdown );
				const modelFragment = editor.data.toModel( viewFragment );

				editor.model.insertContent( modelFragment );

				dropdown.isOpen = false;
				editor.focus();
			}
		} );
	}
}

export class RepliesListView extends FilteredListView {
	/**
	 * Creates an instance of the RepliesListView class.
	 *
	 * @param locale {Locale} The locale used for translation services.
	 * @param url {String} The URL where to download the saved replies list from.
	 */
	constructor( locale, url ) {
		super( locale );

		this.url = url;

		this.title = 'Select a reply';
		this.keystroke = 'Ctrl+.';
		this.filterInputView.placeholder = 'Filter replies...';

		this.extendTemplate( {
			attributes: {
				class: 'github-writer-savedreplies'
			}
		} );

		this.on( 'execute', ( ev, data ) => this.fire( 'reply', data.description ) );
	}

	query( filter ) {
		return this.getReplies()
			.then( searcher => {
				return searcher.query( filter )
					.map( ( { data } ) => data )
					.concat( [ { createView: newReplyView } ] );
			} );

		function newReplyView() {
			const button = new ButtonView( this.locale );
			button.label = 'Create a new saved reply…';
			button.withText = true;
			button.tabindex = 0;
			button.class = 'github-writer-create-reply select-menu-item  select-menu-action';
			button.on( 'execute', () => ( window.__setLocation( '/settings/replies?return_to=1' ) ) );
			return button;
		}
	}

	getReplies() {
		if ( !this._repliesPromise ) {
			this._repliesPromise = downloadReplies.call( this )
				.then( documentFragment => {
					const searcher = new ListFilter();

					documentFragment.querySelectorAll( 'button.select-menu-item' ).forEach( entryEl => {
						const label = entryEl.querySelector( '.select-menu-item-heading' ).textContent.trim();
						const description = entryEl.querySelector( '.js-saved-reply-body' ).textContent.trim();

						searcher.addItem( label, [ description ], { label, description } );
					} );

					return searcher;
				} );
		}

		return this._repliesPromise;

		function downloadReplies() {
			return new Promise( ( resolve, reject ) => {
				const xhr = openXmlHttpRequest( this.url, 'GET' );

				xhr.addEventListener( 'error', () => reject( new Error( `Error loading $(url).` ) ) );
				xhr.addEventListener( 'abort', () => reject() );
				xhr.addEventListener( 'load', () => {
					const parser = new DOMParser();
					const doc = parser.parseFromString( xhr.response, 'text/html' );

					// Resolve the dom document.
					resolve( doc );
				} );

				xhr.send();
			} );
		}
	}
}
