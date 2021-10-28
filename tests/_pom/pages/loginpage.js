/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const GitHubPage = require( '../githubpage' );
const { credentials } = require( '../../config.json' ).github;

/**
 * The login page.
 */
class LoginPage extends GitHubPage {
	/**
	 * Creates an instance of the login page.
	 */
	constructor() {
		super( '/login' );

		// One of the few pages that don't need login.
		this.needsLogin = false;
	}

	/**
	 * Performs login using the credentials provided in the config file.
	 *
	 * @return {Promise<void>}
	 */
	async login() {
		const page = this.browserPage;
		await page.waitFor( '[name="login"]' );
		await page.type( '[name="login"]', credentials.name );
		await page.type( '[name="password"]', credentials.password );
		await Promise.all( [
			// page.waitForNavigation(),
			page.waitForSelector( `meta[name="user-login"][content="${ credentials.name }"]` ),
			page.keyboard.press( 'Enter' )
		] );
	}

	/**
	 * Navigates to the login page.
	 *
	 * @returns {Promise<LoginPage>} The login page.
	 */
	static async getPage() {
		return GitHubPage.getPage.call( this );
	}
}

module.exports = LoginPage;
