/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { Builder } = require( 'selenium-webdriver' );
const { Options: ChromeOptions } = require( 'selenium-webdriver/chrome' );
const { Options: FirefoxOptions } = require( 'selenium-webdriver/firefox' );
const path = require( 'path' );
const repo = require( '../../config' ).github.repo;

module.exports = {
	buildDriver: () => {
		const chromeOptions = new ChromeOptions();
		chromeOptions.addArguments( 'load-extension=' + path.resolve( __dirname, '../../../build/extension-chrome' ) );
		// chromeOptions.headless();

		const firefoxOption = new FirefoxOptions();
		firefoxOption.addExtensions( path.resolve( __dirname, '../../../build/github-rte-firefox.xpi' ) );

		return new Builder()
			.forBrowser( 'chrome' )
			// .forBrowser( 'firefox' )
			.setChromeOptions( chromeOptions )
			.setFirefoxOptions( firefoxOption )
			.build();
	},

	getGitHubUrl: path => {
		return `https://github.com/${ repo }/${ path }`;
	}
};
