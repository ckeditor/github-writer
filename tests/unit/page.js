/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Page from '../../src/app/page';
import { GitHubPage } from '../_util/githubpage';

describe( 'Page', () => {
	it( 'should detect missing page name', () => {
		GitHubPage.reset();

		const page = new Page();

		expect( page.name ).to.equals( 'unknown' );
	} );

	it( 'should detect the page name', () => {
		const page = new Page();

		expect( page.name ).to.equals( 'repo_issue' );
	} );

	it( 'should detect the page type', () => {
		const page = new Page();

		expect( page.type ).to.equals( 'comments' );
	} );

	it( 'should detect a wiki page type', () => {
		GitHubPage.setPageName( 'repo_wiki' );

		const page = new Page();

		expect( page.type ).to.equals( 'wiki' );
	} );
} );
