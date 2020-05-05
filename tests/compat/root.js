/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const GitHubBrowser = require( '../_pom/githubbrowser' );

after( 'should close the browser', () => GitHubBrowser.close() );
