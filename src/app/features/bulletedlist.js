/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Feature from '../feature';

export default class BulletedList extends Feature {
	constructor( editor ) {
		super( 'bulletedlist', editor );

		this.gitHubName = 'unordered-list';
	}

	execute() {
		this.editor.editor.execute( 'bulletedList' );
	}
}
