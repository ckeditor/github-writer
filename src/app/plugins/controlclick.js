/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import KeyStyler from './keystyler';

/**
 * Enables opening the target of links and autolinks in a new window by using ctrl/cmd+click.
 */
export default class ControlClick extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ KeyStyler ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		// Setup proper CSS styling when the ctrl/cmd key is pressed (controlclick.css).
		editor.keyStyler.add( 'Control', 'github-writer-key-ctrl' );
		editor.keyStyler.add( 'Meta', 'github-writer-key-ctrl' );

		const elements = {
			a: 'href',
			autolink: 'data-url'
		};
		const selector = 'a[href],autolink[data-url]';

		editor.ready.then( () => {
			// CKEditor stops the event chain on 'mousedown', so we can't use 'click'.
			editor.ui.getEditableElement().addEventListener( 'mousedown', ev => {
				// Check if the control key is active.
				if ( editor.keyStyler.isActive( 'Control' ) ) {
					// Get the "control-click" enabled element clicked, if any.
					const ccElement = ev.target.closest( selector );
					if ( ccElement ) {
						const urlAttribute = elements[ ccElement.nodeName.toLowerCase() ];
						const url = ccElement.getAttribute( urlAttribute );
						window.open( url, '_blank', 'noopener' );
						ev.preventDefault();
					}
				}
			} );
		} );
	}
}
