/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const GitHubPage = require( '../githubpage' );
const { MainEditor } = require( '../editor' );
const util = require( '../util' );

/**
 * The "file editing" page.
 */
class FileEditPage extends GitHubPage {
	/**
	 * Creates a page for editing a file.
	 *
	 * @param path {String} The file path (branch/file_path).
	 */
	constructor( path ) {
		super( 'edit/' + path );
	}

	/**
	 * Gets the editor used for the issue description body.
	 *
	 * @returns {Promise<MainEditor>} The editor.
	 */
	async getMainEditor() {
		return await this.getEditorByRoot( 'form.js-blob-form', MainEditor );
	}

	/**
	 * Appends text to a new line at the end of the file using GitHub Writer.
	 *
	 * @param textToType
	 * @return {Promise<void>}
	 */
	async appendText( textToType ) {
		const editor = await this.getMainEditor();
		await editor.type(
			// Move to the end of the contents.
			'[Ctrl+A][ArrowRight]',
			'[Enter]',
			textToType
		);
	}

	/**
	 * Appends text to a new line at the end of the file using CodeMirror.
	 *
	 * @param textToType
	 * @return {Promise<void>}
	 */
	async appendCodeMirrorText( textToType ) {
		const selector = '.CodeMirror-code > div:last-of-type';
		await this.browserPage.waitFor( selector, { visible: true } );

		const lastLine = await this.browserPage.$( selector );
		await lastLine.click();

		await util.type( lastLine,
			// Move to the end of the line.
			'[ArrowDown]',
			'[Enter]',
			textToType
		);
	}

	/**
	 * Submits the form, creating a pull request.
	 *
	 * @return {Promise<NewPullRequestPage>}
	 */
	async submitPullRequest() {
		// Check the radio button that creates a pull request.
		await this.browserPage.click( 'input[value="quick-pull"]' );

		// Submit the form and wait for the PR page to come.
		await this.waitForNavigation( this.browserPage.click( 'button#submit-file' ) );

		// Return the create PR page.
		return await GitHubPage.getCurrentPage();
	}

	/**
	 * Navigates to a file editing page.
	 *
	 * @returns {Promise<FileEditPage>} The file editing page.
	 */
	static async getPage( path ) {
		return GitHubPage.getPage.call( this, path );
	}
}

module.exports = FileEditPage;
