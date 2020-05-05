/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Code from '@ckeditor/ckeditor5-basic-styles/src/code';
import CodeBlock from '@ckeditor/ckeditor5-code-block/src/codeblock';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import icon from '@ckeditor/ckeditor5-basic-styles/theme/icons/code.svg';

/**
 * This plugin defines the 'smartcode' UI component, a button, which smartly decides whether to execute
 * the 'code' or 'codeBlock' commands, based on the user selection.
 */
export default class SmartCode extends Plugin {
	static get requires() {
		return [ Code, CodeBlock ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		editor.ui.componentFactory.add( 'smartCode', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: editor.t( 'Code' ),
				icon,
				tooltip: true,
				isToggleable: true
			} );

			// Bind the button state to both the 'code' and 'codeBlock' commands state.
			// If any of them is on/enabled, so is the button.
			{
				const codeCommand = editor.commands.get( 'code' );
				const codeBlockCommand = editor.commands.get( 'codeBlock' );

				view.bind( 'isOn' ).toMany( [ codeCommand, codeBlockCommand ], 'value',
					( codeValue, codeBlockValue ) => !!codeValue || codeBlockValue !== false );

				view.bind( 'isEnabled' ).toMany( [ codeCommand, codeBlockCommand ], 'isEnabled',
					( codeIsEnabled, codeBlockIsEnabled ) => codeIsEnabled || codeBlockIsEnabled );
			}

			// The button will smartly decide which code command to execute, based on the user selection.
			this.listenTo( view, 'execute', () => {
				// Defaults to code block.
				let command = 'codeBlock';

				// If inside inline code, just remove it, by calling its command.
				if ( editor.commands.get( 'code' ).value ) {
					command = 'code';
				}
				// If not inside a code block, apply inline code if the selection is appropriate for it.
				else if ( !editor.commands.get( 'codeBlock' ).value ) {
					const selection = editor.model.document.selection;
					const blocks = Array.from( selection.getSelectedBlocks() );

					// Condition: must be inside a single block.
					if ( blocks.length === 1 ) {
						// Condition: does not contain the entire contents of the block.
						if ( !selection.containsEntireContent( blocks[ 0 ] ) ) {
							command = 'code';
						}
					}
				}

				editor.execute( command );
			} );

			return view;
		} );
	}
}
