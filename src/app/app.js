/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from './editor';
import EmitterMixin from '@ckeditor/ckeditor5-utils/src/emittermixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';

import './theme/githubrte.css';

const editors = new WeakMap();
const actionButtons = new WeakSet();

export default class App {
	static run() {
		if ( App.pageManager ) {
			throw new Error( 'The application is already running.' );
		}

		App.pageManager = new PageManager();

		const promise = App.pageManager.setupMainEditor();

		// Check if the promise has been imediatelly rejected.
		let rejected;
		promise.catch( () => {
			rejected = true;
		} );

		if ( !rejected ) {
			App.pageManager.setupEdit();
		}

		return promise;
	}
}

class PageManager {
	constructor() {
		// Detect if we're in a wiki page.
		const meta = document.querySelector( 'meta[name="selected-link"' );
		if ( meta && meta.getAttribute( 'value' ) === 'repo_wiki' ) {
			this.type = 'wiki';
		} else {
			this.type = 'comments';
		}
	}

	setupEdit() {
		// Comments editing is available only on pages of type "comments".
		if ( this.type !== 'comments' ) {
			return;
		}

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
						App.pageManager.watchEditButton( editButton );
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
		const rootSelectors = {
			wiki: '#gollum-editor',
			comments: '.timeline-comment:not(.comment)'
		};

		// Search for the main editor available in the page, if any.
		const root = document.querySelector( rootSelectors[ this.type ] );

		if ( root ) {
			return this.setupEditor( root );
		}

		return Promise.resolve( false );
	}

	setupEditor( rootElement ) {
		if ( editors.has( rootElement ) ) {
			const error = new Error( 'GitHub RTE error: an editor has already been created for this element.' );
			error.element = rootElement;
			return Promise.reject( error );
		}

		let editor;

		try {
			editor = new Editor( rootElement );
		} catch ( error ) {
			return Promise.reject( error );
		}

		editors.set( rootElement, editor );
		return editor.create();
	}
}

mix( PageManager, EmitterMixin );
