/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from './editor';
import EmitterMixin from '@ckeditor/ckeditor5-utils/src/emittermixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';

// These variables hold references to elements already handled by the application, so they're not touched again.
const editors = new WeakMap();
const actionButtons = new WeakSet();

/**
 * Detects page features, creates editors and setups triggers for on-demand editors injection.
 *
 * @mixes EmitterMixin
 */
export default class PageManager {
	/**
	 * Creates and instance of this class.
	 */
	constructor() {
		// Detect if we're in a wiki page.
		const meta = document.querySelector( 'meta[name="selected-link"' );

		/**
		 * The type of GitHub page the application is running in. There are two possible types:
		 *   - "comments": pages where editors are available in a comment thread structure. This includes: issues and pull reuests.
		 *   - "wiki": wiki pages editing.
		 *
		 * @readonly
		 * @type {String} Either "comments" or "wiki".
		 */
		this.type = ( meta && meta.getAttribute( 'value' ) === 'repo_wiki' ) ?
			'wiki' :
			'comments';
	}

	/**
	 * Searches for the main markdown editor available in the page and injects the RTE around it.
	 *
	 * @returns {Promise<Editor>|Promise<Boolean>} A promise that resolves to the editor created once its CKEditor
	 * instance is created and ready or `false` if no editor was found.
	 */
	setupMainEditor() {
		// These are the dom selectors for the outermost element that holds the whole markdown editor infrastructure in the page.
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

	/**
	 * Creates an editor around the GitHub markdown editor enclosed by the given dom element.
	 *
	 * @param {HTMLElement} rootElement The outermost DOM element that contains the whole structure around a GitHub markdown editor.
	 * @returns {Promise<Editor>} A promise that resolves to the editor created once its CKEditor instance is created and ready.
	 */
	setupEditor( rootElement ) {
		// Do not create editors for elements which already have editors.
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

		// Save a reference to the root element, so we don't create editors for it again.
		editors.set( rootElement, editor );

		return editor.create();
	}

	/**
	 * Setups comments editing buttons for the on-demand creation of editors.
	 */
	setupEdit() {
		// Comments editing is available only on pages of type "comments". Do nothign otherwise.
		if ( this.type !== 'comments' ) {
			return;
		}

		// Setup all edit buttons currently available in the page.
		{
			const editButtons = Array.from( document.querySelectorAll( '.js-comment-edit-button' ) );
			editButtons.forEach( button => this.setupEditButton( button ) );
		}

		// Watch for edit buttons created on demand (when saving a comment).
		{
			// Creates a mutation observer that will waiting for any dom element to be added to tha page.
			{
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

			// Searches for edit buttons inside the given element adn setup them for creating editors on demand.
			function searchEditButtons( root ) {
				root.querySelectorAll( '.js-comment-edit-button' )
					.forEach( editButton => {
						this.setupEditButton( editButton );
					} );
			}
		}
	}

	/**
	 * Setups an edit button so it creates an editor on demand.
	 *
	 * In reality, the editor is not created when the edit button is clicked but when it's displayed, by clicking its
	 * parent kebab action button.
	 *
	 * @param {HTMLElement} editButton The edit button element.
	 */
	setupEditButton( editButton ) {
		// Take the kebab button that opens the menu where "Edit" is in.
		const actionButton = editButton.closest( 'details-menu' ).previousElementSibling;

		// This check should never be true but we have it here just in case.
		if ( !actionButton ) {
			// Shows the error in the console but don't break the code execution.
			const error = new Error( 'GitHub RTE error: no action button found for the edit button element.' );
			error.element = editButton;
			console.error( error );
			return;
		}

		// Be sure to not touch a button that has already been setup.
		if ( !actionButtons.has( actionButton ) ) {
			// Create the Editor instance in the moment the button is clicked.
			actionButton.addEventListener( 'click', () => {
				const rootElement = actionButton.closest( '.timeline-comment' );
				this.setupEditor( rootElement );
			}, { once: true, passive: true, capture: false } );

			// Save a reference to this button so we don't touch it again.
			actionButtons.add( actionButton );
		}
	}
}

// The emitter features are not used here but are exposed so any part of the app can have a way to fire "global" events
// (e.g. QuoteSelection plugin).
mix( PageManager, EmitterMixin );
