/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

/**
 * Makes it possible for external code, including cross-domain, to send commands to the editor by
 * broadcasting a messages with `window.postMessage( { type: 'CKEditor-Messenger-Request' } )`.
 *
 * This feature is used by the GitHub Writer functional tests.
 */
export default class Messenger extends Plugin {
	init() {
		const editor = this.editor;

		window.addEventListener( 'message', function( event ) {
			const { type, editorId, requestId, command, args = [] } = event.data;

			if ( type === 'CKEditor-Messenger-Request' && String( editorId ) === String( editor.id ) ) {
				const commandFn = Messenger.commands[ command ];
				const status = commandFn ? 'ok' : 'command-unknown';
				const returnValue = commandFn && commandFn.apply( editor, args );

				window.postMessage( {
					type: 'CKEditor-Messenger-Response',
					requestId,
					status,
					returnValue
				}, '*' );
			}
		}, false );
	}
}

Messenger.commands = {
	getData() {
		return this.getData();
	},

	getModelData() {
		return this.model.data;
	}
};
