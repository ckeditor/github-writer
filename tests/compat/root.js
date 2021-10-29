/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const GitHubBrowser = require( '../_pom/githubbrowser' );

GitHubBrowser.headless = true;
GitHubBrowser.extension = false;

after( 'should close the browser', () => GitHubBrowser.close() );
