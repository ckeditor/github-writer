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

		return pageManager.setupMainEditor();
	}
}

class PageManager {
	constructor() {
		// Start watching all edit buttons available in the page.
		const editButtons = Array.from( document.querySelectorAll( '.js-comment-edit-button' ) );
		editButtons.forEach( button => this.watchEditButton( button ) );
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

		const editor = new Editor( commentRoot );
		editors.set( commentRoot, editor );
		return editor.create();
	}
}
