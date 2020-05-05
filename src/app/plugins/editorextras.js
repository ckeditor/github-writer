/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

/**
 * Enables the following utils in the editor instance API:
 * - `editor.isEmpty`: observable property that tells if the editor has no content.
 * - `editor.focus()`: move the user focus into the editing view.
 */
export default class EditorExtras extends Plugin {
	constructor( editor ) {
		super( editor );

		/**
		 * Tells if the editor content is empty.
		 *
		 * @observable
		 * @readonly
		 * @memberOf Editor
		 * @member {Boolean} #isEmpty
		 */
		{
			// Initial value.
			editor.set( 'isEmpty', true );

			const document = editor.model.document;
			editor.listenTo( document, 'change:data', () => {
				editor.set( 'isEmpty', !document.model.hasContent( document.getRoot() ) );
			} );
		}

		/**
		 * Sets the user selection focus into the editor contents.
		 *
		 * @memberOf Editor
		 */
		editor.focus = () => {
			editor.editing.view.focus();
		};

		/**
		 * A promise that resolves once the "reallyReady" event is fired.
		 *
		 * @type {Promise<Editor>} The promise.
		 */
		editor.ready = new Promise( resolve => {
			// TODO: This should be done actually once the create().then chain is done.
			editor.once( 'reallyReady', () => resolve( editor ) );
		} );
	}
}
