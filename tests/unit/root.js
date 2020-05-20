/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Page from '../../src/app/page';

import { GitHubPage } from '../_util/githubpage';

before( () => {
	Page.MAX_TIMEOUT = 1;
} );

// Page setup and cleanup.
{
	beforeEach( 'setup the page and app', () => {
		GitHubPage.setPageName();
		GitHubPage.setApp();
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
		sinon.stub( console, 'log' ).callsFake( ( ...args ) => {
			if ( !args[ 1 ] || args[ 1 ].constructor.name !== 'Editor' ) {
				console.log.wrappedMethod.apply( console, args );
			}
		} );
	}
}
