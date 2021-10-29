/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const puppeteer = require( 'puppeteer' );
const path = require( 'path' );

/**
 * A browser controller.
 *
 * @type {Object}
 */
module.exports = {
	/**
	 * Configures the test runner to launch a headless browser.
	 *
	 * @default false
	 * @type {Boolean}
	 */
	headless: false,

	/**
	 * Configures the test runner to load the GitHub Writer extension (from the build directory) into the browser.
	 *
	 * @default trye
	 * @type {Boolean}
	 */
	extension: true,

	/**
	 * Gets the browser page.
	 *
	 * In the first call, it launches the browser and creates an empty page.
	 * Successive calls return the same page instance.
	 *
	 * @return {Promise<*>}
	 */
	async getPage() {
		if ( !this._page ) {
			const extensionPath = this.extension && path.resolve( __dirname, '../../build/github-writer-chrome' );

			const browser = this._browser = await puppeteer.launch( {
				headless: this.headless,
				defaultViewport: null,
				args: extensionPath ? [
					`--disable-extensions-except=${ extensionPath }`,
					`--load-extension=${ extensionPath }`
				] : []
			} );
			this._page = await browser.newPage();
			await this._page.setBypassCSP( true );
		}

		return this._page;
	},

	/**
	 * Closes/kills the browser.
	 *
	 * @return {Promise<void>}
	 */
	async close() {
		await this._browser.close();
	}
};
