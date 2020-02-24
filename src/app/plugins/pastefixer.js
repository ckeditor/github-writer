/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Clipboard from '@ckeditor/ckeditor5-clipboard/src/clipboard';

export default class PasteFixer extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ Clipboard ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		editor.editing.view.document.on( 'clipboardInput', ( evt, data ) => {
			const dataTransfer = data.dataTransfer;

			let html = dataTransfer.getData( 'text/html' );

			if ( html ) {
				// Fix url links with text equal to the href.
				html = html.replace( /<a href="(?<url>https?:.+?)">\k<url><\/a>/gi, '$<url>' );
				dataTransfer.setData( 'text/html', html );
			}
		} );
	}
}
