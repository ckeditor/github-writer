/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const GitHubBrowser = require( './githubbrowser' );
const { Editor } = require( './editor' );

const { repo, credentials } = require( '../config.json' ).github;

const htmlToJson = require( 'html-to-json' );

const urlResolvers = [];

/**
 * A generic GitHub page.
 */
class GitHubPage {
	/**
	 * Creates and instance of the GitHubPage for the given GitHub path in the configured repository.
	 *
	 * @param path {String} The path. E.g. '/issues`.
	 */
	constructor( path ) {
		/**
		 * The full url of this page.
		 *
		 * @type {String}
		 */
		this.url = GitHubPage.getGitHubUrl( path );

		/**
		 * If login is necessary to reach this page.
		 *
		 * @default true
		 * @type {boolean}
		 */
		this.needsLogin = true;
	}

	/**
	 * Navigate to the page. If necessary it logins before opening the page.
	 * @returns {Promise<void>}
	 */
	async goto() {
		const browserPage = this.browserPage = await GitHubBrowser.getPage();

		if ( this.needsLogin ) {
			const loggedIn = browserPage.url().match( /^https:\/\/github.com\// ) &&
				!!( await browserPage.$( `meta[name="user-login"][content="${ credentials.name }"]` ) );

			if ( !loggedIn ) {
				const LoginPage = require( './pages/loginpage' );
				const loginPage = await LoginPage.getPage();
				await loginPage.login();
			}
		}

		await browserPage.goto( this.url );
	}

	/**
	 * Gets a GitHub Writer editor present in the page based on its id.
	 *
	 * @param id {String} The editor id.
	 * @returns {Editor} The editor.
	 */
	async getEditorById( id ) {
		return new Editor( this, id );
	}

	/**
	 * Gets a GitHub Writer editor present in the page based on its root element.
	 *
	 * @param selector {String|ElementHandle} The root element selector or the element itself.
	 * @param [EditorClass=Editor] {Function} The editor class used to create returned editor instance.
	 * @param extraArgs {...*} Extra arguments to pass to the EditorClass constructor.
	 * @returns {Editor} The editor.
	 */
	async getEditorByRoot( selector, EditorClass = Editor, ...extraArgs ) {
		const root = ( typeof selector === 'string' ) ? await this.browserPage.$( selector ) : selector;

		if ( !root ) {
			throw new Error( `No root element found for the selector \`${ selector }\`.` );
		}

		const id = await root.evaluate( root => root.getAttribute( 'data-github-writer-id' ) );

		if ( !id ) {
			throw new Error( `No editor found for the root \`${ selector }\`.` );
		}

		return new EditorClass( this, id, ...extraArgs );
	}

	/**
	 * Waits for page navigation to happen (and eventually other promises to resolve).
	 *
	 * @param otherPromises {...Promise} Other promises to wait for.
	 * @return {Promise<never>}
	 */
	async waitForNavigation( ...otherPromises ) {
		const [ response ] = await Promise.all( [
			this.browserPage.waitForNavigation(),
			...otherPromises
		] );

		if ( response && !response.ok() ) {
			return Promise.reject( new Error( `Server response error: (${ response.status() }) ${ response.statusText() }` ) );
		}
	}

	/**
	 * Checks if the specified selector matches any element in the page.
	 *
	 * @param selector {String} The css selector.
	 * @returns {Promise<Boolean>} `true` if an element was found.
	 */
	async hasElement( selector ) {
		return !!( await this.browserPage.$( selector ) );
	}

	/**
	 * Waits for an element to be visible in the page.
	 *
	 * @param element {ElementHandle} The element.
	 * @return {Promise<void>}
	 */
	async waitVisible( element ) {
		await this.browserPage.waitForFunction( element => {
			return ( element.offsetParent !== null );
		}, {}, element );
	}

	/**
	 * Gets the list of emojis available in GitHub.
	 *
	 * @returns {Promise<Array>} The list of emojis.
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
	 * Makes a xhr request from this page.
	 *
	 * @param url {String} The target url.
	 * @param [json=false] {Boolean} Whether a json response is expected.
	 * @returns {Promise<String|*>} The response body.
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
	 * Returns an already open instance of this page.
	 *
	 * @returns {Promise<GitHubPage>}
	 */
	static async getPage( ...args ) {
		const page = new this( ...args );
		await page.goto();
		return page;
	}

	/**
	 * Returns an instance of the current page page using resolvers registered with addUrlResolver()
	 * that match the page url.
	 *
	 * If no resolver is found, an instance of GitHubPage is returned.
	 *
	 * @return {Promise<GitHubPage>} The page.
	 */
	static async getCurrentPage() {
		const browserPage = await GitHubBrowser.getPage();
		const url = await browserPage.url();
		let page;

		for ( let i = 0; i < urlResolvers.length; i++ ) {
			page = urlResolvers[ i ]( url );

			if ( page ) {
				break;
			}
		}

		if ( !page ) {
			page = new GitHubPage( url );
		}

		page.browserPage = browserPage;

		return page;
	}

	/**
	 * Registers a resolver that can be used to create page instances based on the page url.
	 *
	 * The callback provided by the resolver receives a single parameter, the url, and must return an instance
	 * of GitHubPage if the url matches the resolver requirements. Otherwise it should return any falsy value.
	 *
	 * @param callback {Function} The callback to be called to resolve a url.
	 */
	static addUrlResolver( callback ) {
		urlResolvers.push( callback );
	}

	/**
	 * Resolves a path to a GitHub url:
	 *  - `/path` => `https://github.com/path`
	 *  - `path` => `https://github.com/path`
	 *  - `https://github.com/path` => `https://github.com/path`
	 *
	 * @param path {String} The path to be resolved.
	 * @returns {String} The full GitHub path.
	 */
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
