/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const GitHubBrowser = require( './githubbrowser' );
const { repo, credentials } = require( '../config.json' ).github;

class GitHubPage {
	/**
	 * @param path {String}
	 */
	constructor( path ) {
		this.url = GitHubPage.getGitHubUrl( path );
		this.needsLogin = true;
	}

	/**
	 * @returns {Promise<void>}
	 */
	async goto() {
		const browserPage = this.browserPage = await GitHubBrowser.getPage();

		if ( this.needsLogin ) {
			const loggedIn = browserPage.url().match( /^https:\/\/github.com\// ) &&
				!!( await browserPage.$( `meta[name="user-login"][content="${ credentials.name }"]` ) );

			if ( !loggedIn ) {
				const LoginPage = require( './loginpage' );
				const loginPage = await LoginPage.getPage();
				await loginPage.login();
			}
		}

		await browserPage.goto( this.url );
	}

	async hasElement( selector ) {
		return !!( await this.browserPage.$( selector ) );
	}

	/**
	 * @returns {Promise<GitHubPage>}
	 */
	static async getPage() {
		const page = new this();
		await page.goto();
		return page;
	}

	static getGitHubUrl( path ) {
		let url = path;
		if ( path.startsWith( '/' ) ) {
			url = `https://github.com${ path }`;
		} else if ( !/^https?:/.test( path ) ) {
			return `https://github.com/${ repo }/${ path }`;
		}

		return url.replace( /\/+$/, '' );
	}
}

module.exports = GitHubPage;
