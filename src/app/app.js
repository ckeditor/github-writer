/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from './editor';

import './theme/githubrte.css';

let pageManager;
const editors = new WeakMap();
const actionButtons = new WeakSet();

export default class App {
	static run() {
		if ( pageManager ) {
			throw new Error( 'The application is already running.' );
		}

		pageManager = new PageManager();

		const promise = pageManager.setupMainEditor();

		// Check if the promise has been imediatelly rejected.
		let rejected;
		promise.catch( () => {
			rejected = true;
		} );

		if ( !rejected ) {
			pageManager.setupEdit();
		}

		return promise;
	}
}

class PageManager {
	setupEdit() {
		// Watch all edit buttons currently available in the page.
		{
			const editButtons = Array.from( document.querySelectorAll( '.js-comment-edit-button' ) );
			editButtons.forEach( button => this.watchEditButton( button ) );
		}

		// Watch for thew edit buttons created on demand (when saving a comment).
		{
			createObserver.call( this );

			function searchEditButtons( root ) {
				root.querySelectorAll( '.js-comment-edit-button' )
					.forEach( editButton => {
						pageManager.watchEditButton( editButton );
					} );
			}

			function createObserver() {
				const observer = new MutationObserver( mutations => {
					mutations.forEach( mutation => Array.from( mutation.addedNodes ).forEach( node => {
						if ( node instanceof HTMLElement ) {
							searchEditButtons.call( this, node );
						}
					} ) );
				} );

				observer.observe( document.body, {
					childList: true,
					subtree: true
				} );
			}
		}
	}

	watchEditButton( editButton ) {
		// Take the button (***) that opens the menu where "Edit" is in.
		const actionButton = editButton.closest( 'details-menu' ).previousElementSibling;

		if ( !actionButton ) {
			const error = new Error( 'GitHub RTE error: no action button found for the edit button element.' );
			error.element = editButton;
			console.error( error );
			return;
		}

		if ( !actionButtons.has( actionButton ) ) {
			// Create the Editor instance in the moment the button is clicked.
			actionButton.addEventListener( 'click', () => {
				const commentRoot = actionButton.closest( '.timeline-comment' );
				this.setupEditor( commentRoot );
			}, { once: true, passive: true, capture: false } );

			actionButtons.add( actionButton );
		}
	}

	setupMainEditor() {
		// Search for the main editor available in the page, if any.
		const commentRoot = document.querySelector( '.timeline-comment:not(.comment)' );

		if ( commentRoot ) {
			return this.setupEditor( commentRoot );
		}

		return Promise.resolve( false );
	}

	setupEditor( commentRoot ) {
		if ( editors.has( commentRoot ) ) {
			const error = new Error( 'GitHub RTE error: an editor has already been created for this element.' );
			error.element = commentRoot;
			return Promise.reject( error );
		}

		let editor;

		try {
			editor = new Editor( commentRoot );
		} catch ( error ) {
			return Promise.reject( error );
		}

		editors.set( commentRoot, editor );
		return editor.create();
	}
}
