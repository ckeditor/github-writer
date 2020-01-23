/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from './editor';
import EmitterMixin from '@ckeditor/ckeditor5-utils/src/emittermixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';
import { injectFunctionExecution } from './util';

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
		/**
		 * The GitHub name for the kind of page we're in.
		 *
		 * @readonly
		 * @type {String}
		 */
		this.page = document.querySelector( 'meta[name="selected-link"]' );
		this.page = this.page ? this.page.getAttribute( 'value' ) : 'unknown';

		/**
		 * The type of GitHub page the application is running in. There are two possible types:
		 *   - "comments": pages where editors are available in a comment thread structure. This includes: issues and pull requests.
		 *   - "wiki": wiki pages editing.
		 *
		 * @readonly
		 * @type {String} Either "comments" or "wiki".
		 */
		this.type = ( this.page === 'repo_wiki' ) ?
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
		let root;

		if ( ( root = document.querySelector( 'form#new_issue' ) ) ) {
			this.type = 'comments';
		} else if ( ( root = document.querySelector( 'form#new_pull_request' ) ) ) {
			this.type = 'comments';
		} else if ( ( root = document.querySelector( 'form.js-new-comment-form' ) ) ) {
			this.type = 'comments';
		} else if ( ( root = document.querySelector( 'div.pull-request-review-menu > form' ) ) ) {
			this.type = 'comments';
		} else if ( ( root = document.querySelector( 'form[name="gollum-editor"]' ) ) ) {
			this.type = 'wiki';
		}

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
		let editorCreatePromise = editors.get( rootElement );

		if ( editorCreatePromise ) {
			return editorCreatePromise;
		}

		let editor;

		try {
			editor = new Editor( rootElement );
		} catch ( error ) {
			return Promise.reject( error );
		}

		editorCreatePromise = editor.create();

		// Save a reference to the root element, so we don't create editors for it again.
		editors.set( rootElement, editorCreatePromise );

		return editorCreatePromise;
	}

	/**
	 * Setups comments editing buttons for the on-demand creation of editors.
	 */
	setupEdit() {
		// Comments editing is available only on pages of type "comments". Do nothing otherwise.
		if ( this.type !== 'comments' ) {
			return;
		}

		// Setup all edit buttons currently available in the page.
		{
			const editButtons = Array.from( document.querySelectorAll( '.js-comment-edit-button' ) );
			editButtons.forEach( button => this.setupEditButton( button ) );
		}
	}

	/**
	 * Creates a mutation observer that will watch for elements created on demand, which should trigger
	 * the creation of editors.
	 *
	 * Examples of on demand elements:
	 *   * Edit buttons for new comments posted.
	 *   * The review button in a PR.
	 */
	setupObserver() {
		// Creates a mutation observer that will waiting for any dom element to be added to tha page.
		{
			const observer = new MutationObserver( mutations => {
				mutations.forEach( mutation => Array.from( mutation.addedNodes ).forEach( node => {
					if ( node instanceof HTMLElement ) {
						searchEditButtons.call( this, node );
						searchInlineReviewComments.call( this, node );
					}
				} ) );
			} );

			observer.observe( document.body, {
				childList: true,
				subtree: true
			} );
		}

		// Searches for edit buttons inside the given element and setup them for creating editors on demand.
		function searchEditButtons( element ) {
			element.querySelectorAll( '.js-comment-edit-button' )
				.forEach( editButton => {
					// noinspection JSPotentiallyInvalidUsageOfClassThis
					this.setupEditButton( editButton );
				} );
		}

		// Search for inline review comments (created with the + button in source lines).
		function searchInlineReviewComments( element ) {
			// noinspection JSPotentiallyInvalidUsageOfClassThis
			element.querySelectorAll( 'form.js-inline-comment-form' )
				.forEach( root => this.setupEditor( root ) );
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
				const rootElement = actionButton.closest( '.js-comment' ).querySelector( 'form.js-comment-update' );
				this.setupEditor( rootElement );
			}, { once: true, passive: true, capture: false } );

			// Save a reference to this button so we don't touch it again.
			actionButtons.add( actionButton );
		}
	}

	setupInlineCommentTogglers() {
		document.querySelectorAll( '.js-toggle-inline-comment-form' )
			.forEach( toggler => {
				toggler.addEventListener( 'click', () => {
					const container = toggler.closest( '.js-inline-comment-form-container' );
					const root = container && container.querySelector( 'form' );
					this.setupEditor( root );
				} );
			} );
	}

	/**
	 * Setups additional page tweaks that makes things work right.
	 */
	setupPageHacks() {
		// Disable pjax in the tabs of pull request pages. That's unfortunate but pjax makes things break hard.
		{
			if ( this.page === 'repo_pulls' ) {
				document.querySelectorAll( 'nav.tabnav-tabs > a' )
					.forEach( el => el.setAttribute( 'data-skip-pjax', 'true' ) );

				// At this point, as a small enhancement, we can also remove the pjax prefetches that GH does.
				document.querySelectorAll( 'link[rel="pjax-prefetch"]' )
					.forEach( el => el.remove() );

				// This is specific to the "Commits" tab.
				document.querySelectorAll( 'a[data-pjax="true"], a.sha' )
					.forEach( el => {
						el.removeAttribute( 'data-pjax' );
						el.setAttribute( 'data-skip-pjax', 'true' );
					} );
			}
		}
	}

	setupQuoteSelection() {
		// Our dear friends from GH made our lives much easier. A custom event is fired, containing the markdown
		// representation of the selection.
		//
		// Buuut... for security reasons, extensions can't access the CustomEvent.details property (where the markdown
		// is stored) from CustomEvent's fired in the page.
		//
		// To solve the problem, we inject a script that runs in the page context, listening to the desired event.
		// This script then takes the information we need from the event and broadcast it with `window.postMessage`.
		//
		// Finally, we intercept the broadcasted message within the extension context and send the quote to the editor.

		injectFunctionExecution( function() {
			document.addEventListener( 'quote-selection', ev => {
				// Marks the comment thread container with a timestamp so we can retrieve it later.
				const timestamp = Date.now();
				ev.target.setAttribute( 'data-github-rte-quote-selection-timestamp', timestamp );

				// Broadcast the event data that we need in the plugin.
				window.postMessage( {
					type: 'GitHub-RTE-Quote-Selection',
					timestamp,
					text: ev.detail.selectionText
				}, '*' );
			}, false );
		} );

		// Listen to the broadcasted message.
		window.addEventListener( 'message', event => {
			if ( event.data.type === 'GitHub-RTE-Quote-Selection' && event.data.text ) {
				// Get the GH target container it holds an editor root element.
				const target = document.querySelector( `[data-github-rte-quote-selection-timestamp="${ event.data.timestamp }"]` );

				// The target should contain its own main editor inside a form, which has a few possible class names.
				const rootSelectors = [
					'form.js-new-comment-form',
					'form.js-inline-comment-form'
				];

				// Take the first form element that matches any selector.
				const root = rootSelectors.reduce( ( found, selector ) => {
					return found || target.querySelector( selector );
				}, null );

				if ( root ) {
					// Send the quote to the editor assigned to this root element, if any.
					// TODO: create the editor on demand if not yet available for this root.
					if ( editors.has( root ) ) {
						this.setupEditor( root )
							.then( editor => {
								editor.quoteSelection( event.data.text );
							} );
					}
				}
			}
		}, false );
	}
}

// The emitter features are not used here but are exposed so any part of the app can have a way to fire "global" events
// (e.g. QuoteSelection plugin).
mix( PageManager, EmitterMixin );
