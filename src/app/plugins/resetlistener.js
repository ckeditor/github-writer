/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

/**
 * Makes it possible for external code, including cross-domain, to reset the editor contents by focusing it and
 * broadcasting a standard message with `window.postMessage( { type: 'GitHub-RTE-Reset-Editor' } )`.
 *
 * This feature is used by the GitHub RTE functional tests.
 */
export default class ResetListener extends Plugin {
	init() {
		const editor = this.editor;

		window.addEventListener( 'message', function( event ) {
			if ( event.data.type === 'GitHub-RTE-Reset-Editor' ) {
				editor.setData( '' );
			}
		}, false );
	}
}
