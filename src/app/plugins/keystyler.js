/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import EditorExtras from './editorextras';

/**
 * Adds `editor.keyStyler` so the editor's editable can he class names injected while configured keys are pressed.
 */
export default class KeyStyler extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ EditorExtras ];
	}

	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		/**
		 * The KeyStyleManager used to configure this editor.
		 *
		 * @type {KeyStylerManager}
		 * @memberOf Editor
		 */
		editor.keyStyler = new KeyStylerManager( editor );
	}
}

/**
 * Add CSS classes to an editable while configured keys are pressed.
 */
export class KeyStylerManager {
	/**
	 * Creates an instance of the KeyStylerManager class.
	 * @param editor {Editor} The editor which editable will be styled.
	 */
	constructor( editor ) {
		this._keys = {};

		editor.ready.then( () => {
			const editable = this._editable = editor.ui.getEditableElement();

			document.addEventListener( 'keydown', ev => {
				const className = this._keys[ ev.key ];
				className && editable.classList.add( className );
			} );

			document.addEventListener( 'keyup', ev => {
				const className = this._keys[ ev.key ];
				className && editable.classList.remove( className );
			} );
		} );
	}

	/**
	 * Configure the styles to apply the specified class when a key is pressed.
	 *
	 * @param key {String} The key (see dom KeyboardEvent.key).
	 * @param className {String} The class name to be applied.
	 */
	add( key, className ) {
		this._keys[ key ] = className;
	}

	/**
	 * Check if the specified key class is currently applied.
	 *
	 * @param key {String} The key previously registered with `add()`.
	 * @return {Boolean} `true` if the key is currently active.
	 */
	isActive( key ) {
		const className = this._keys[ key ];
		return !!className && this._editable && this._editable.classList.contains( className );
	}
}
