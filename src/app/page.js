/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from './editor/editor';
import editorModes from './editor/modes';
import { injectFunctionExecution } from './modules/util';

/**
 * Detects page features, creates editors and setups triggers for on-demand editors injection.
 *
 * @mixes EmitterMixin
 */
export default class Page {
	/**
	 * The GitHub name for the kind of page we're in.
	 *
	 * @readonly
	 * @type {String}
	 */
	get name() {
		// The name may change dynamically on pjax enabled pages, so we recalculate it for each call with a getter.
		const meta = document.querySelector( 'meta[name="selected-link"]' );
		return meta ? meta.getAttribute( 'value' ) : 'unknown';
	}

	/**
	 * The type of GitHub page the application is running in. There are two possible types:
	 *   - "comments": pages where editors are available in a comment thread structure. This includes: issues and pull requests.
	 *   - "wiki": wiki pages editing.
	 *
	 * @readonly
	 * @type {String} Either "comments" or "wiki".
	 */
	get type() {
		return ( this.name === 'repo_wiki' ) ?
			'wiki' :
			'comments';
	}
}

{
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
			ev.target.setAttribute( 'data-github-writer-quote-selection-timestamp', timestamp );

			// Broadcast the event data that we need in the plugin.
			window.postMessage( {
				type: 'GitHub-Writer-Quote-Selection',
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
		if ( event.data.type === 'GitHub-Writer-Quote-Selection' && event.data.text ) {
			// Get the GH target container it holds an editor root element.
			const target = document.querySelector( `[data-github-writer-quote-selection-timestamp="${ event.data.timestamp }"]` );

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
				if ( Editor.hasEditor( root ) ) {
					Editor.createEditor( root )
						.then( editor => {
							if ( editor.getMode() === editorModes.RTE ) {
								editor.ckeditor.quoteSelection( event.data.text );
							}
						} );
				}
			}
		}
	}, false );
}
