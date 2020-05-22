/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

/**
 * A plugin for fixing small things, that don't deserve a specific plugin or partition of code.
 */
export default class General extends Plugin {
	/**
	 * @inheritDoc
	 */
	afterInit() {
		this._fixInsertTableCommand();
	}

	/**
	 * Fixes the insertion of tables, so the first row is a header. (#165)
	 * @private
	 */
	_fixInsertTableCommand() {
		const editor = this.editor;
		const command = editor.commands.get( 'insertTable' );

		if ( command ) {
			// Hook after the command execution.
			command.on( 'execute', () => {
				// The selection will be already in the interested row, so we just execute 'setTableRowHeader'.
				editor.execute( 'setTableRowHeader', { forceValue: true } );
			}, { priority: 'low' } );
		}
	}
}
