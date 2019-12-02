/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import App from '../app';
import Editor from '../editor';
import { scrollViewportToShowTarget } from '@ckeditor/ckeditor5-utils/src/dom/scroll';
import { injectFunctionExecution } from '../util';

export default class QuoteSelection extends Plugin {
	init() {
		const editor = this.editor;

		// Our dear friends from GH made our lives much easier. A custom event is fired, containing
		// the markdown representation of the selection. (Details at the EOF).
		App.pageManager.on( 'quote-selection', ( undefined, markdown ) => {
			if ( editor.githubEditor.getMode() === Editor.modes.RTE ) {
				const viewFragment = editor.data.processor.toView( markdown );
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
					{
						editor.editing.view.focus();

						// After the changes have been made so the editable will have its final size.
						setTimeout( () => {
							// Scroll the browser to show the editor.
							scrollViewportToShowTarget( {
								target: editor.githubEditor.dom.root,
								viewportOffset: 100
							} );

							// Be sure the caret is also visible.
							editor.editing.view.scrollToTheSelection();
						}, 0 );
					}
				} );
			}
		} );
	}
}

// For security reasons, extensions can't access the CustomEvent.details property from CustomEvent's fired from the page.
//
// To solve the problem, we inject a script that runs in the page context, listening to the desired event.
// This script then takes the information we need from the event and broadcast it with `window.postMessage`.
//
// Finally, we intercept the broadcasted message within the extension context and re-fire it so the plugin code can intercept it.
{
	// Avoid this script to be run more than once
	if ( !window.githubRteQuoteSelectionFixed ) {
		window.githubRteQuoteSelectionFixed = true;

		injectFunctionExecution( function() {
			document.addEventListener( 'quote-selection', ev => {
				// Broadcast the event data that we need in the plugin.
				window.postMessage( {
					type: 'GitHub-RTE-Quote-Selection',
					text: ev.detail.selectionText
				}, '*' );
			}, false );
		} );

		// Listen to the broadcasted message.
		window.addEventListener( 'message', function( event ) {
			if ( event.data.type === 'GitHub-RTE-Quote-Selection' && event.data.text ) {
				App.pageManager.fire( 'quote-selection', event.data.text );
			}
		}, false );
	}
}
