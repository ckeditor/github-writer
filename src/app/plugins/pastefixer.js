/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Clipboard from '@ckeditor/ckeditor5-clipboard/src/clipboard';
import UpcastWriter from '@ckeditor/ckeditor5-engine/src/view/upcastwriter';

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

		// Fix links with text that match their href url.
		{
			// The following is the ideal implementation of this fix, because it's simpler and catches
			// links inside complex content. This doesn't work though, because of
			// https://github.com/ckeditor/ckeditor5/issues/6312
			//
			// editor.editing.view.document.on( 'clipboardInput', ( evt, data ) => {
			// 	const dataTransfer = data.dataTransfer;
			//
			// 	let html = dataTransfer.getData( 'text/html' );
			//
			// 	if ( html ) {
			// 		// Fix url links with text equal to the href.
			// 		html = html.replace( /<a href="(?<url>https?:.+?)">\k<url><\/a>/gi, '$<url>' );
			// 		dataTransfer.setData( 'text/html', html );
			// 	}
			// } );

			editor.plugins.get( 'ClipboardPipeline' ).on( 'inputTransformation', ( evt, data ) => {
				// We just want to catch pasting of a single url that is auto-linking to itself.
				const node = data.content.childCount === 1 && data.content.getChild( 0 );

				// Ensure that we have a link.
				if ( node && node.is( 'element' ) && node.name === 'a' ) {
					const href = node.getAttribute( 'href' );
					const text = node.childCount === 1 && node.getChild( 0 ).data;

					if ( href && text && href === text ) {
						const writer = new UpcastWriter();

						data.content = writer.createDocumentFragment( [
							writer.createText( text )
						] );
					}
				}
			} );
		}
	}
}
