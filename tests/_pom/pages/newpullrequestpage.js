/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const GitHubPage = require( '../githubpage' );
const { MainEditor } = require( '../editor' );

/**
 * The "new pull request" page.
 */
class NewPullRequestPage extends GitHubPage {
	/**
	 * Creates an instance of the "new pull request" page.
	 *
	 * @param baseCommit {String} The base commit of the pull request.
	 * @param changesCommit {String} The commit to compare, containing the changes.
	 */
	constructor( baseCommit, changesCommit ) {
		super( `compare/${ baseCommit }...${ changesCommit }?quick_pull=1` );
	}

	/**
	 * Gets the editor used for the pull request description body.
	 *
	 * @returns {Promise<MainEditor>} The editor.
	 */
	async getMainEditor() {
		return await this.getEditorByRoot( 'form#new_pull_request', MainEditor );
	}
}

module.exports = NewPullRequestPage;

GitHubPage.addUrlResolver( url => {
	const [ , baseCommit, changesCommit ] = url.match( /\/compare\/(.+)\.\.\.(.+)\?quick_pull=1$/ ) || [];

	if ( baseCommit ) {
		return new NewPullRequestPage( baseCommit, changesCommit );
	}
} );
