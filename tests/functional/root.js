/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const GitHubBrowser = require( '../_pom/githubbrowser' );

after( 'should close the browser', () => GitHubBrowser.close() );
