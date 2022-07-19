/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const CommentsTimelinePage = require( './commentstimelinepage' );
const GitHubPage = require( '../githubpage' );

/**
 * A issue page.
 */
class IssuePage extends CommentsTimelinePage {
	/**
	 * Creates an instance of the issue page.
	 *
	 * @param number {String|Number} The issue number.
	 */
	constructor( number ) {
		super( 'issues/' + number );
	}

	/**
	 * Deletes the issue.
	 *
	 * @return {Promise<GitHubPage>} The page loaded after the issue is deleted (`/issues`);
	 */
	async deleteIssue() {
		await this.browserPage.click( '.discussion-sidebar-item svg.octicon-trash' );
		await this.waitForNavigation( this.browserPage.click( 'button[name="verify_delete"]' ) );

		return await GitHubPage.getCurrentPage();
	}
}

module.exports = IssuePage;

GitHubPage.addUrlResolver( url => {
	const [ , number ] = url.match( /\/issues\/(\d+)$/ ) || [];

	if ( number ) {
		return new IssuePage( number );
	}
} );
