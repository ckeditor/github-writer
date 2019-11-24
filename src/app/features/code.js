/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Feature from '../feature';

export default class Code extends Feature {
	constructor( editor ) {
		super( 'code', editor );
	}

	execute() {
		// Get the CKEditor instance.
		const editor = this.editor.editor;

		// Defaults to code block.
		let command = 'codeBlock';

		// If inside inline code, just remove it.
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

		// Finally, if the selection is not good for inline code, go ahead with code block.
		editor.execute( command );
	}
}
