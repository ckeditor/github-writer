/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const GitHubPage = require( '../githubpage' );
const { MainEditor } = require( '../editor' );

/**
 * The "new wiki" page.
 */
class NewWikiPage extends GitHubPage {
	/**
	 * An instance of the "new wiki" page.
	 */
	constructor() {
		super( 'wiki/_new' );
	}

	/**
	 * Sets the wiki page title.
	 *
	 * @param title {String} The title.
	 * @return {Promise<void>}
	 */
	async setTitle( title ) {
		const page = this.browserPage;
		await page.type( '[name="wiki[name]"]', title );
	}

	/**
	 * Gets the editor used for the wiki page body.
	 *
	 * @returns {Promise<MainEditor>} The editor.
	 */
	async getMainEditor() {
		const selector = 'form[name="gollum-editor"][data-github-writer-id]';

		// Wait for the editor to be created.
		await this.browserPage.waitFor( selector, { visible: true } );

		return await this.getEditorByRoot( selector, MainEditor );
	}

	/**
	 * Navigates to the "new wiki" page.
	 *
	 * @returns {Promise<LoginPage>} The "new wiki" page.
	 */
	static async getPage() {
		return GitHubPage.getPage.call( this );
	}
}

module.exports = NewWikiPage;
