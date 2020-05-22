/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../../src/app/editor/editor';

import { GitHubPage } from '../_util/githubpage';

import CKEditorConfig from '../../src/app/editor/ckeditorconfig';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import ShiftEnter from '@ckeditor/ckeditor5-enter/src/shiftenter';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import EditorExtras from '../../src/app/plugins/editorextras';
import LiveModelData from '../../src/app/plugins/livemodeldata';

before( () => {
	Editor.MAX_TIMEOUT = 1;
} );

// Page setup and cleanup.
{
	beforeEach( 'setup the page', () => {
		GitHubPage.setPageName();

		// Default to an essential editor configuration.
		sinon.stub( CKEditorConfig, 'get' ).returns( {
			plugins: [ EditorExtras, LiveModelData, Paragraph, ShiftEnter, Bold, Italic ]
		} );

		// Clear session storage.
		sessionStorage.clear();
	} );

	afterEach( 'cleanup created editors', () => {
		if ( window.GITHUB_WRITER_EDITORS && window.GITHUB_WRITER_EDITORS.length ) {
			const promises = [];

			window.GITHUB_WRITER_EDITORS.forEach( editor => promises.push( editor.destroy() ) );

			window.GITHUB_WRITER_EDITORS = [];

			return Promise.all( promises );
		}
	} );

	afterEach( 'reset the page', () => {
		GitHubPage.reset();
	} );
}

// Stubs cleanup.
{
	before( 'mute console right away', () => {
		muteConsole();
	} );

	afterEach( 'restore all stubs', () => {
		sinon.restore();

		// The only stub we want always active us console.log.
		muteConsole();
	} );

	// Mute dev logging.
	function muteConsole() {
		sinon.stub( console, 'log' );
		sinon.stub( console, 'time' );
		sinon.stub( console, 'timeEnd' );
	}
}
