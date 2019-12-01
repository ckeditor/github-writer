/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { Builder } = require( 'selenium-webdriver' );
const { Options } = require( 'selenium-webdriver/chrome' );
const path = require( 'path' );
const repo = require( '../../config' ).github.repo;

module.exports = {
	buildDriver: () => {
		const extensionPath = path.resolve( __dirname, '../../../build/extension-chrome' );
		const options = new Options();
		options.addArguments( 'load-extension=' + extensionPath );

		return new Builder()
			.forBrowser( 'chrome' )
			.setChromeOptions( options )
			.build();
	},

	getGitHubUrl: path => {
		return `https://github.com/${ repo }/${ path }`;
	}
};
