/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { Builder, Key, By, until } = require( 'selenium-webdriver' );
const { Options: ChromeOptions } = require( 'selenium-webdriver/chrome' );
const { Options: FirefoxOptions } = require( 'selenium-webdriver/firefox' );
const path = require( 'path' );
const { repo, credentials } = require( '../../config' ).github;

let util = module.exports = {
	/**
	 * Bootstraps the Selenium WebDriver that runs the tests.
	 *
	 * @returns {!ThenableWebDriver} A WebDriver ready to be used.
	 */
	buildDriver: () => {
		// During development, we point Chrome to the directory containing the extension files.
		const chromeOptions = new ChromeOptions();
		chromeOptions.addArguments( 'load-extension=' + path.resolve( __dirname, '../../../build/github-rte-chrome' ) );

		// Theoretically it's possible to run tests in a headless Chrome. Tests fail with this, though.
		// chromeOptions.headless();

		// Firefox instead, must be pointed to a .xpi file.
		const firefoxOption = new FirefoxOptions();
		firefoxOption.addExtensions( path.resolve( __dirname, '../../../build/github-rte-firefox.xpi' ) );

		return new Builder()
			// For now, the following must be switched to change the running browser.
			.forBrowser( 'chrome' )
			// .forBrowser( 'firefox' )
			.setChromeOptions( chromeOptions )
			.setFirefoxOptions( firefoxOption )
			.build();
	},

	/**
	 * Gets the full url for a GitHub page path.
	 * For example, "issues/new" returns "https://github.com/[user]/[repo]/issues/new".
	 *
	 * The user/repo information is retrieved from the tests {config.json} file.
	 *
	 * @param {String} path The page path. e.g. 'issues/new'.
	 * @returns {String} The full url for the provided path.
	 */
	getGitHubUrl: path => {
		return `https://github.com/${repo}/${path}`;
	},

	/**
	 * Waits until the element that tells that the user is logged in to be available.
	 * @returns {Promise<void>} A promise that resolves once the element is available.
	 */
	checkLoggedIn: async () => {
		// Be sure that we're still properly logged in.
		await global.driver.wait( until.elementLocated( By.css( `meta[name="user-login"][content="${credentials.name}"]` ) ), 10000 );
	},

	/**
	 * Login, if necessary, and return the WebDriver used for testing.
	 * @returns {Promise<*|ThenableWebDriver>} The WebDriver.
	 */
	login: async () => {
		let driver = global.driver || ( global.driver = util.buildDriver() );

		const url = await driver.getCurrentUrl();
		const loggedIn = url.match( /^https:\/\/github.com\// ) &&
			await driver.findElement( By.css( `meta[name="user-login"][content="${credentials.name}"]` ) );

		if ( !loggedIn ) {
			await driver.get( 'https://github.com/login' );
			await driver.findElement( By.name( 'login' ) ).sendKeys( credentials.name );
			await driver.findElement( By.name( 'password' ) ).sendKeys( credentials.password, Key.ENTER );
			await driver.wait( until.elementLocated( By.css( `meta[name="user-login"][content="${credentials.name}"]` ) ) );
		}

		return driver;
	},

	/**
	 * Quit the WebDriver. To be called once all tests are done.
	 */
	quit: () => {
		global.driver && global.driver.quit();
	}
};
