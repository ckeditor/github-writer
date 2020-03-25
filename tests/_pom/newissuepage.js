/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const GitHubPage = require( './githubpage' );

class NewIssuePage extends GitHubPage {
	constructor() {
		super( 'issues/new' );
	}

	async setTitle( title ) {
		const page = this.browserPage;
		await page.type( '[name="issue[title]"]', title );
	}

	/**
	 * @returns {Promise<NewIssuePage>}
	 */
	static async getPage() {
		return GitHubPage.getPage.call( this );
	}
}

module.exports = NewIssuePage;
