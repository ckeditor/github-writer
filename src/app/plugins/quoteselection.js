/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import BlockQuoteEditing from '@ckeditor/ckeditor5-block-quote/src/blockquoteediting';

import { scrollViewportToShowTarget } from '@ckeditor/ckeditor5-utils/src/dom/scroll';

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
