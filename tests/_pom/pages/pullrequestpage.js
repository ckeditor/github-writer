/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const CommentsTimelinePage = require( './commentstimelinepage' );
const GitHubPage = require( '../githubpage' );

/**
 * The "pull request" page.
 */
class PullRequestPage extends CommentsTimelinePage {
	/**
	 * Creates an instance of the "pull request" page.
	 *
	 * @param number {String|Number} The pull request number.
	 */
	constructor( number ) {
		super( 'pull/' + number );
	}

	/**
	 * Closes the pull request and delete its associated branch.
	 *
	 * @return {Promise<void>}
	 */
	async closePullRequest() {
		await this.browserPage.click( 'button[name="comment_and_close"]' );

		// Delete the branch.
		await this.browserPage.waitFor( 'div.post-merge-message button[type="submit"]' );
		await this.browserPage.click( 'div.post-merge-message button[type="submit"]' );

		// After delete, the "restore" button should be displayed, which confirms the cleanup.
		await this.browserPage.waitFor( 'form.pull-request-ref-restore' );
	}
}

module.exports = PullRequestPage;

GitHubPage.addUrlResolver( url => {
	const [ , number ] = url.match( /\/pull\/(\d+)$/ ) || [];

	if ( number ) {
		return new PullRequestPage( number );
	}
} );

