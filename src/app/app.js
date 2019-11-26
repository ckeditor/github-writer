/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from './editor';

import './theme/githubrte.css';

export default class App {
	static run() {
		if ( this.isRunning ) {
			throw new Error( 'The application is already running.' );
		}

		this.isRunning = true;

		// Search for the main editor available in the page, if any.
		const mainEditorRoot = document.querySelector( '.timeline-comment:not(.comment)' );

		if ( mainEditorRoot ) {
			createEditor( mainEditorRoot );
		}

		function createEditor( markdownEditorRootElement ) {
			const editor = new Editor( markdownEditorRootElement );
			editor.create();
		}
	}
}
