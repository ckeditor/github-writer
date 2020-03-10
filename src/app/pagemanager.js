/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from './editor';
import EmitterMixin from '@ckeditor/ckeditor5-utils/src/emittermixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';
import { injectFunctionExecution } from './util';

// The list of created editor promises. The key in this list is the root element.
const editors = new WeakMap();
let quoteSelectionReady = false;

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

	init() {
		// Control buttons that fire the creation of editors.
		{
			// Edit option for comments: listen to "comment action" buttons and create the editor.
			this.addClickListener( '.timeline-comment-action', actionsButton => {
				let editButton = actionsButton.closest( 'details' );
				editButton = editButton && editButton.querySelector( '.js-comment-edit-button' );

				if ( editButton ) {
					const rootElement = editButton.closest( '.js-comment' ).querySelector( 'form.js-comment-update' );
					this.setupEditor( rootElement, true );
				}
			} );

			// Inline comments in PRs: the "Reply..." field-like button.
			this.addClickListener( '.js-toggle-inline-comment-form', button => {
				const container = button.closest( '.js-inline-comment-form-container' );
				const root = container && container.querySelector( 'form' );
				root && this.setupEditor( root );
			} );

			// Code line comments: the "+" button...fires an event when the form for code comments is injected.
			document.addEventListener( 'inlinecomment:focus', ev => {
				const root = ev.target.querySelector( 'form' );
				root && this.setupEditor( root ).then( editor => editor.dom.tabs.write.click() );
			} );
		}

		// Handle editors inside pjax containers.
		{
			document.addEventListener( 'pjax:start', ( { target } ) => {
				this.destroyEditors( target );
			}, { passive: true } );

			document.addEventListener( 'pjax:end', () => {
				setTimeout( () => {
					this.scan();
				}, 0 );
			}, { passive: true } );
		}

		this.setupQuoteSelection();

		return this.scan();
	}

	addClickListener( selector, callback ) {
		if ( !this._clickListeners ) {
			this._clickListeners = [];

			document.addEventListener( 'click', ( { target } ) => {
				this._clickListeners.forEach( ( { selector, callback } ) => {
					const wantedTarget = target.closest( selector );

					if ( wantedTarget ) {
						callback.call( this, wantedTarget );
					}
				} );
			}, { passive: true, capture: true } );
		}

		this._clickListeners.push( { selector, callback } );
	}

	/**
	 * Searches for visible markdown editors available in the page and injects the RTE around them.
	 *
	 * @returns {Promise<[Editor]>} A promise that resolves with all editors created, if any.
	 */
	scan() {
		const promises = [];

		// Setup comment editors that are visible to the user.
		{
			[
				'.inline-comment-form-container.open form.js-inline-comment-form',
				'.is-comment-editing form.js-comment-update'
			].forEach( selector => {
				document.querySelectorAll( selector ).forEach( root => {
					promises.push( this.setupEditor( root ) );
				} );
			} );
		}

		// Setup the main editor.
		{
			let root;
			( root = document.querySelector( 'form#new_issue' ) ) ||
			( root = document.querySelector( 'form#new_pull_request' ) ) ||
			( root = document.querySelector( 'form.js-new-comment-form' ) ) ||
			( root = document.querySelector( 'div.pull-request-review-menu > form' ) ) ||
			( root = document.querySelector( 'form[name="gollum-editor"]' ) );

			if ( root ) {
				promises.push( this.setupEditor( root ) );
			}
		}

		return Promise.all( promises );
	}

	/**
	 * Creates an editor around the GitHub markdown editor enclosed by the given dom element.
	 *
	 * @param {HTMLElement} rootElement The outermost DOM element that contains the whole structure around a GitHub markdown editor.
	 * @param {Boolean} [withTimeout] If the setup should happen with timeout, hopefully in the next available idle loop of the browser.
	 * @returns {Promise<Editor>} A promise that resolves to the editor created once its CKEditor instance is created and ready.
	 */
	setupEditor( rootElement, withTimeout ) {
		if ( withTimeout ) {
			return new Promise( resolve => {
				if ( window.requestIdleCallback ) {
					window.requestIdleCallback( () => resolve( this.setupEditor( rootElement ) ), { timeout: PageManager.MAX_TIMEOUT } );
				} else {
					setTimeout( () => resolve( this.setupEditor( rootElement ) ), 1 );
				}
			} );
		}

		let editorCreatePromise = editors.get( rootElement );

		if ( editorCreatePromise ) {
			return editorCreatePromise;
		}

		let editor;

		try {
			// Check if we're in a dirty dom.
			{
				const existingId = rootElement.getAttribute( 'data-github-rte-id' );
				if ( existingId ) {
					// This is most likely a clone from a previous existing editor, landing into a pjax snapshot.
					// Clean it up so a new editor can be started on it.
					Editor.cleanup( rootElement );

					// Ensure that things here are also clean (all references to this editor are dead).
					editors.delete( existingId );
					delete editors[ existingId ];
				}
			}

			editor = new Editor( rootElement );
		} catch ( error ) {
			return Promise.reject( error );
		}

		editor.domManipulator.addAttribute( rootElement, 'data-github-rte-id', editor.id );

		editorCreatePromise = editor.create();

		// Save a reference to the root element, so we don't create editors for it again.
		editors.set( rootElement, editorCreatePromise );

		// Save also an id reference, this time to the editor itself.
		editors[ editor.id ] = editor;

		return editorCreatePromise;
	}

	destroyEditors( container ) {
		const promises = [];
		container.querySelectorAll( '[data-github-rte-id]' ).forEach( rootElement => {
			const editorPromise = editors.get( rootElement );
			if ( editorPromise ) {
				promises.push( editorPromise.then( editor => editor.destroy() ) );
			}
			editors.delete( rootElement );
		} );

		return Promise.all( promises );
	}

	setupQuoteSelection() {
		if ( quoteSelectionReady ) {
			return;
		}
		quoteSelectionReady = true;

		// Our dear friends from GH made our lives much easier. A custom event is fired, containing the markdown
		// representation of the selection.
		//
		// Buuut... for security reasons, Chrome extensions can't access the CustomEvent.details property
		// (where the markdown is stored) from CustomEvent's fired in the page.
		//
		// To solve the problem, we inject a script that runs in the page context, listening to the desired event.
		// This script then takes the information we need from the event and broadcast it with `window.postMessage`.
		//
		// Buuuut... for security reasons, Firefox extensions can't inject scripts in the page context.
		// But, unlike with Chrome, they're allowed to access CustomEvent.details. So we run the script directly.
		//
		// Finally, we intercept the broadcasted message within the extension context and send the quote to the editor.

		const addEventProxy = /* istanbul ignore next */ function() {
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
		};

		// Chrome.
		/* istanbul ignore else */
		if ( window.chrome ) {
			injectFunctionExecution( addEventProxy );
		}
		// Firefox.
		else {
			addEventProxy();
		}

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
				const root = target && rootSelectors.reduce( ( found, selector ) => {
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

PageManager.MAX_TIMEOUT = 500;

// The emitter features are not used here but are exposed so any part of the app can have a way to fire "global" events
// (e.g. QuoteSelection plugin).
mix( PageManager, EmitterMixin );
