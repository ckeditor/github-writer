/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module enter/enter
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import CoreEnter from '@ckeditor/ckeditor5-enter/src/enter';
import CoreShiftEnter from '@ckeditor/ckeditor5-enter/src/shiftenter';

/**
 * Handles the Enter key inside the editor.
 *
 * Other than loading the default core plugins for the Enter key, it fixes the behavior of the plugins by giving no
 * action to Enter when Ctrl/Cmd/Alt is pressed.
 *
 * @extends module:core/plugin~Plugin
 */
export default class Enter extends Plugin {
	static get requires() {
		return [ CoreEnter, CoreShiftEnter ];
	}

	init() {
		const viewDocument = this.editor.editing.view.document;

		this.listenTo( viewDocument, 'enter', ( evt, data ) => {
			const domEvent = data.domEvent;

			if ( domEvent.altKey || domEvent.ctrlKey || domEvent.metaKey ) {
				evt.stop();
			}
		} );
	}
}
