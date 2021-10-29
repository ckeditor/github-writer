/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Editor from '../editor/editor';
import editorModes from '../editor/modes';

import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import BlockQuoteEditing from '@ckeditor/ckeditor5-block-quote/src/blockquoteediting';

import { scrollViewportToShowTarget } from '@ckeditor/ckeditor5-utils/src/dom/scroll';
import { injectFunctionExecution } from '../modules/util';

/**
 * Simulates the native "quote selection" feature from GitHub (the "r" key).
 */
export default class QuoteSelection extends Plugin {
	static get requires() {
		return [ Paragraph, BlockQuoteEditing ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		/**
		 * Mimics the GitHub behavior with the quotation of selected text in the page. It inserts the quotation in the
		 * editor and moves the selection right after it so the user can comment on that.
		 *
		 * @param selectionMarkdown The markdown text to be quotes, most likely derived from the user selection.
		 * @memberOf Editor
		 */
		editor.quoteSelection = selectionMarkdown => {
			// Creates a model fragment out of the markdown received.
			const viewFragment = editor.data.processor.toView( selectionMarkdown );
			const modelFragment = editor.data.toModel( viewFragment );

			// Insert the event text as a quote at the end of the root.
			editor.model.change( writer => {
				// Our model manipulation target is the root.
				const root = editor.model.document.getRoot();

				// Trim the empty paragraph at the end of the root, if available, as we want to replace it.
				{
					const lastChild = root.getChild( root.childCount - 1 );

					if ( lastChild && lastChild.name === 'paragraph' ) {
						if ( lastChild.isEmpty ) {
							writer.remove( lastChild );
						}
					}
				}

				// Create a blockquote with the event contents and add it to the end of the root.
				{
					const quote = writer.createElement( 'blockQuote' );
					writer.append( modelFragment, quote );
					writer.insert( quote, root, 'end' );

					// Insert an empty paragraph after the blockquote and move the selection to it.
					{
						const paragraph = writer.createElement( 'paragraph' );
						writer.insert( paragraph, quote, 'after' );

						writer.setSelection( paragraph, 'in' );
					}
				}

				// Show the editor to the user.
				QuoteSelection.scrollToSelection( editor );
			} );
		};
	}
}

// The following is hard to test, and break tests so we always stub it.
/* istanbul ignore next */
QuoteSelection.scrollToSelection = editor => {
	editor.focus();

	// Timeout, so changes are applied and the editable will have its final size (autogrow).
	setTimeout( () => {
		// Scroll the browser to show the editor.
		scrollViewportToShowTarget( {
			target: editor.githubEditor.dom.root,
			viewportOffset: 100
		} );

		// Be sure the caret is also visible.
		editor.editing.view.scrollToTheSelection();
	}, 0 );
};

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
			// The target should contain its own main editor inside a form, which has a few possible class names.
			const root = ev.target.querySelector(
				'form.js-new-comment-form[data-github-writer-id],' +
				'form.js-inline-comment-form[data-github-writer-id]' );

			if ( root ) {
				// Broadcast the event data that we need in the plugin.
				window.postMessage( {
					type: 'GitHub-Writer-Quote-Selection',
					id: Number( root.getAttribute( 'data-github-writer-id' ) ),
					text: ev.detail.selectionText
				}, '*' );
			}
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
			// Retrieve the editor root.
			const root = document.querySelector( `form[data-github-writer-id="${ event.data.id }"]` );

			Editor.createEditor( root )
				.then( editor => {
					if ( editor.getMode() === editorModes.RTE ) {
						editor.ckeditor.quoteSelection( event.data.text );
					}
				} );
		}
	}, false );
}
