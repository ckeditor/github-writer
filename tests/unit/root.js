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
