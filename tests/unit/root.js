/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import PageManager from '../../src/app/pagemanager';
import { GitHubPage } from '../_util/githubpage';

before( () => {
	PageManager.MAX_TIMEOUT = 1;
} );

beforeEach( () => {
	GitHubPage.setApp();
	GitHubPage.setPageName();
} );

afterEach( 'reset the page', () => {
	GitHubPage.reset();
} );

afterEach( () => {
	sinon.restore();
} );

afterEach( 'Cleanup created editors', () => {
	if ( window.GITHUB_RTE_EDITORS && window.GITHUB_RTE_EDITORS.length ) {
		const promises = [];

		sinon.stub( console, 'log' );	// Silence the dev log.
		window.GITHUB_RTE_EDITORS.forEach( editor => promises.push( editor.destroy() ) );

		window.GITHUB_RTE_EDITORS = [];

		return Promise.all( promises )
			.then( () => console.log.restore() );
	}
} );
