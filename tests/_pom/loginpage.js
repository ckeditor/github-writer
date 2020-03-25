/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const GitHubPage = require( './githubpage' );
const { credentials } = require( '../config.json' ).github;

class LoginPage extends GitHubPage {
	constructor() {
		super( '/login' );
		this.needsLogin = false;
	}

	async login() {
		const page = this.browserPage;
		await page.type( '[name="login"]', credentials.name );
		await page.type( '[name="password"]', credentials.password );
		await Promise.all( [
			// page.waitForNavigation(),
			page.waitForSelector( `meta[name="user-login"][content="${ credentials.name }"]` ),
			page.keyboard.press( 'Enter' )
		] );
	}

	/**
	 * @returns {Promise<LoginPage>}
	 */
	static async getPage() {
		return GitHubPage.getPage.call( this );
	}
}

module.exports = LoginPage;
