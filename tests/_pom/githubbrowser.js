/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const puppeteer = require( 'puppeteer' );

module.exports = class GitHubBrowser {
	static async getPage() {
		if ( !this._page ) {
			const browser = this._browser = await puppeteer.launch( {
				headless: true
			} );
			this._page = await browser.newPage();
			await this._page.setBypassCSP( true );
		}

		return this._page;
	}

	static async close() {
		this._browser.close();
	}
};
