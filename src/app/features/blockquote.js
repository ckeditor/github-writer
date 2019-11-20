/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Feature from '../feature';

export default class BlockQuote extends Feature {
	constructor( editor ) {
		super( 'blockquote', editor );

		this.gitHubName = 'quote';
	}

	execute() {
		this.editor.editor.execute( 'blockQuote' );
	}
}
