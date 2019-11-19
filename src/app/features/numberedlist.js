/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Feature from '../feature';

export default class NumberedList extends Feature {
	constructor( editor ) {
		super( 'numberedlist', editor );

		this.gitHubName = 'ordered-list';
	}

	execute() {
		this.editor.editor.execute( 'numberedList' );
	}
}
