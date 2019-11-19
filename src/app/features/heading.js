/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Feature from '../feature';

export default class Heading extends Feature {
	constructor( editor ) {
		super( 'heading', editor );

		this.gitHubName = 'header';
	}

	execute() {
		if ( this.editor.editor.commands.get( 'heading' ).value ) {
			this.editor.editor.execute( 'paragraph' );
		} else {
			this.editor.editor.execute( 'heading', { value: 'heading3' } );
		}
	}
}
