/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import CKEditorAutoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import InlineAutoformatEditing from '@ckeditor/ckeditor5-autoformat/src/inlineautoformatediting';
import BlockAutoformatEditing from '@ckeditor/ckeditor5-autoformat/src/blockautoformatediting';

/**
 * An implementation of CKEditorAutoformat with additional auto-formatters for the GitHub RTE editor.
 */
export default class Autoformat extends CKEditorAutoformat {
	/**
	 * @inheritDoc
	 */
	afterInit() {
		super.afterInit();

		// Additional auto-formatters.
		{
			const commands = this.editor.commands;

			// ~text~ -> strikethrough
			if ( commands.get( 'strikethrough' ) ) {
				/* eslint-disable no-new */
				const codeCallback = getCallbackFunctionForInlineAutoformat( this.editor, 'strikethrough' );

				new InlineAutoformatEditing( this.editor, /(~)([^~]+)(~)$/g, codeCallback );
				/* eslint-enable no-new */
			}

			// --- (3 or more dashes) -> horizontal line
			if ( commands.get( 'horizontalLine' ) ) {
				// eslint-disable-next-line no-new
				new BlockAutoformatEditing( this.editor, /^-{3,}$/, () => {
					this.editor.model.enqueueChange( () => {
						this.editor.execute( 'horizontalLine' );
					} );
				} );
			}
		}
	}
}

// TODO: Maybe enhance the CKEditor Autoformat plugin to be easier to configure new autoformaters.
// Plain copy from @ckeditor/ckeditor5-autoformat/src/autoformat, which is not exported.
function getCallbackFunctionForInlineAutoformat( editor, attributeKey ) {
	return ( writer, rangesToFormat ) => {
		const command = editor.commands.get( attributeKey );

		if ( !command.isEnabled ) {
			return false;
		}

		const validRanges = editor.model.schema.getValidRanges( rangesToFormat, attributeKey );

		for ( const range of validRanges ) {
			writer.setAttribute( attributeKey, true, range );
		}

		// After applying attribute to the text, remove given attribute from the selection.
		// This way user is able to type a text without attribute used by auto formatter.
		writer.removeSelectionAttribute( attributeKey );
	};
}
