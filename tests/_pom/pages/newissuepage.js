/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const GitHubPage = require( '../githubpage' );
const { MainEditor } = require( '../editor' );

/**
 * The "new issue" page.
 */
class NewIssuePage extends GitHubPage {
	/**
	 * Creates and instance of the "new issue" page.
	 */
	constructor() {
		super( 'issues/new' );
	}

	/**
	 * Sets the issue title.
	 *
	 * @param title {String} The title.
	 * @return {Promise<void>}
	 */
	async setTitle( title ) {
		await this.browserPage.type( '[name="issue[title]"]', title );
	}

	/**
	 * Gets the editor used for the issue description body.
	 *
	 * @returns {Promise<MainEditor>} The editor.
	 */
	async getMainEditor() {
		return await this.getEditorByRoot( '#new_issue', MainEditor );
	}

	/**
	 * Navigates to the new issue page.
	 *
	 * @returns {Promise<LoginPage>} The new issue page.
	 */
	static async getPage() {
		return GitHubPage.getPage.call( this );
	}
}

module.exports = NewIssuePage;
