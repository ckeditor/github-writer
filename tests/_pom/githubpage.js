/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const GitHubBrowser = require( './githubbrowser' );
const { repo, credentials } = require( '../config.json' ).github;

const htmlToJson = require( 'html-to-json' );

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
	 * @returns {Promise<Array>}
	 */
	async getEmojis() {
		const url = await this.browserPage.$eval( 'text-expander[data-emoji-url]', el => el.getAttribute( 'data-emoji-url' ) );
		const html = await this.xhrRequest( url );

		const emojis = await htmlToJson.parse( html, [ 'li', li => {
			// Take the first element child (either <g-emoji> or <img>).
			const child = li.find( '*' );

			const name = li.attr( 'data-emoji-name' );
			const aka = li.attr( 'data-text' ).replace( name, '' ).trim();
			const url = child.attr( 'fallback-src' ) || child.attr( 'src' );
			const unicode = child.text();

			const emoji = { name, url };

			if ( aka ) {
				emoji.aka = aka;
			}

			if ( unicode ) {
				emoji.unicode = unicode;
			}

			return emoji;
		} ] );

		// Sort it alphabetically, just like GH does.
		return emojis.sort( ( a, b ) => {
			if ( a.name > b.name ) {
				return 1;
			}
			if ( a.name < b.name ) {
				return -1;
			}
			return 0;
		} );
	}

	/**
	 * @param url {String}
	 * @param [json=false] {Boolean}
	 * @returns {Promise<String|*>}
	 */
	xhrRequest( url, json = false ) {
		return this.browserPage.evaluate( ( url, json ) => {
			return new Promise( ( resolve, reject ) => {
				const xhr = new XMLHttpRequest();
				xhr.open( 'GET', url, true );

				// Some of the requests don't work without this one.
				xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );

				if ( json ) {
					xhr.responseType = 'json';
					xhr.setRequestHeader( 'Accept', 'application/json' );
				}

				xhr.addEventListener( 'error', () => reject( new Error( `Error loading $(url).` ) ) );
				xhr.addEventListener( 'abort', () => reject() );
				xhr.addEventListener( 'load', () => {
					resolve( xhr.response );
				} );

				xhr.send();
			} );
		}, url, json );
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
