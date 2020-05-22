/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import CodeBlock from '@ckeditor/ckeditor5-code-block/src/codeblock';
import QuoteSelection from './quoteselection';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import icon from '../icons/suggestion.svg';

/**
 * Replicates the "suggestion" feature available in the original GH editor for comments on commit lines.
 */
export default class Suggestion extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ CodeBlock, QuoteSelection ];
	}

	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		// Append the "suggestion" language to the list of languages.
		{
			const languages = editor.config.get( 'codeBlock.languages' );
			languages.push( {
				language: 'suggestion', label: 'Suggestion'
			} );
			editor.config.set( 'codeBlock.languages', languages );
		}
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		// The configuration that says that suggestion is enabled.
		const isEnabled = editor.config.get( 'githubWriter.suggestion.enabled' );

		// Add the UI factory for the toolbar button.
		editor.ui.componentFactory.add( 'suggestion', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: 'Insert a suggestion',
				icon,
				tooltip: true,
				isEnabled
			} );

			this.listenTo( view, 'execute', () => {
				// Get the original code lines from the button in the markdown toolbar.
				// We do this at this stage because, during the RTE editor creation, GH may still not have filled
				// the "data-lines" attribute.
				const lines = editor.githubEditor.dom.toolbar
					.querySelector( 'button.js-suggested-change-toolbar-item' )
					.getAttribute( 'data-lines' );

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

					// Create a code block with original code lines and add it to the end of the root.
					{
						const code = writer.createElement( 'codeBlock', { language: 'suggestion' } );
						writer.append( writer.createText( lines ), code );
						writer.insert( code, root, 'end' );

						// Insert an empty paragraph after the code block.
						{
							const paragraph = writer.createElement( 'paragraph' );
							writer.insert( paragraph, code, 'after' );
						}

						// Set the selection at the end of the code block.
						writer.setSelection( code, 'end' );
					}

					// Show the editor to the user.
					QuoteSelection.scrollToSelection( editor );
				} );
			} );

			return view;
		} );
	}
}
