/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from './editor';

export default class App {
	static run() {
		if ( this.isRunning ) {
			throw new Error( 'The application is already running.' );
		}

		this.isRunning = true;

		// Search for markdown editors already existing in the page.
		searchMarkdownEditors( document.body );

		// Watches for new mardown editor dinamically created.
		createObserver();

		function searchMarkdownEditors( root ) {
			// Search for root elements that enclose each of the markdown editors.
			root.querySelectorAll( '.js-previewable-comment-form' ).forEach( el => {
				createEditor( el );
			} );
		}

		function createObserver() {
			const observer = new MutationObserver( mutations => {
				mutations.forEach( mutation => {
					for ( var i = 0; i < mutation.addedNodes.length; i++ ) {
						const node = mutation.addedNodes[ i ];

						// TODO: Maybe filter this better for performance?
						if ( node instanceof HTMLElement ) {
							searchMarkdownEditors( node );
						}
					}
				} );
			} );

			observer.observe( document.body, {
				childList: true,
				subtree: true
			} );
		}

		function createEditor( markdownEditorRootElement ) {
			const editor = new Editor( markdownEditorRootElement );
			editor.create();
		}
	}
}
