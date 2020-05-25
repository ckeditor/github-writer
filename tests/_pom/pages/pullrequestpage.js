/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const CommentsTimelinePage = require( './commentstimelinepage' );
const GitHubPage = require( '../githubpage' );
const { MainEditor, NewLineCommentEditor } = require( '../editor' );

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
	 * Switch between the main tabs in the pull request page.
	 * @param tabName {string} The tab name.
	 * @return {Promise<void>}
	 */
	async switchTab( tabName ) {
		switch ( tabName ) {
			case 'conversation': {
				// The tab button.
				const button = await this.browserPage.evaluateHandle( () => {
					return document.querySelector( '#conversation_tab_counter' ).closest( 'a' );
				} );

				// If not selected, click on it.
				const isSelected = await button.evaluate( button => button.classList.contains( 'selected' ) );
				if ( !isSelected ) {
					await this.waitForNavigation( button.click() );
				}

				// Wait for an element specific to this tab to be visible.
				await this.browserPage.waitForSelector( 'button[name="comment_and_close"]', { visible: true } );
				break;
			}
			case 'files': {
				// The tab button.
				const button = await this.browserPage.evaluateHandle( () => {
					return document.querySelector( '#files_tab_counter' ).closest( 'a' );
				} );

				// If not selected, click on it.
				const isSelected = await button.evaluate( button => button.classList.contains( 'selected' ) );
				if ( !isSelected ) {
					await this.waitForNavigation( button.click() );
				}

				// Wait for an element specific to this tab to be visible.
				await this.browserPage.waitForSelector( '.js-reviews-toggle', { visible: true } );
				break;
			}
		}
	}

	/**
	 * Gets the editor under the review button in files tab.
	 * @return {Promise<*>}
	 */
	async getReviewEditor() {
		await this.switchTab( 'files' );

		await this.browserPage.click( '.js-reviews-toggle' );

		return await this.getEditorByRoot( 'div.pull-request-review-menu > form', MainEditor );
	}

	/**
	 * Gets the editor for the specified line in the files tabs.
	 * @param position {Number} The sequential line position in the diff list. It's not the line number in the file.
	 * @return {Promise<*>}
	 */
	async getLineCommentEditor( position ) {
		await this.switchTab( 'files' );

		const buttonSelector = `button.js-add-single-line-comment[data-position="${ position }"]`;
		await this.browserPage.waitForSelector( buttonSelector );

		const root = await this.browserPage.evaluateHandle( buttonSelector => {
			return new Promise( resolve => {
				document.addEventListener( 'inlinecomment:focus', ev => {
					resolve( ev.target.querySelector( 'form' ) );
				}, { once: true } );

				document.querySelector( buttonSelector ).click();
			} );
		}, buttonSelector );

		return await this.getEditorByRoot( root, NewLineCommentEditor, position );
	}

	/**
	 * @param position {Number} The code line position. A sequential number for every entry line in the diff.
	 * @param index {Number} The comment index in the code line comments thread.
	 * @return {Promise<*>}
	 */
	async getLineCommentHtml( position, index ) {
		await this.switchTab( 'files' );

		// Wait for the comment to be available.
		await this.browserPage.waitForFunction( function getLineCommentHtmlWait( position, index ) {
			const button = document.querySelector(
				`button.js-add-single-line-comment[data-position="${ position }"]` );
			let container = button && button.closest( 'tr' );
			container = container && container.nextElementSibling;
			container = container && container.querySelector( '.js-comments-holder' );

			return !!container && !!container.querySelectorAll(
				'.review-comment-contents.js-suggested-changes-contents' )[ index ];
		}, {}, position, index );

		return await this.browserPage.evaluate( function getLineCommentHtmlEval( position, index ) {
			const button = document.querySelector(
				`button.js-add-single-line-comment[data-position="${ position }"]` );
			const container = button
				.closest( 'tr' )
				.nextElementSibling
				.querySelector( '.js-comments-holder' );

			const element = container.querySelectorAll(
				'.review-comment-contents.js-suggested-changes-contents .js-comment-body' )[ index ];
			return element.innerHTML.replace( /^\s+|\s+$/g, '' );
		}, position, index );
	}

	/**
	 * Closes the pull request and delete its associated branch.
	 *
	 * @return {Promise<void>}
	 */
	async closePullRequest() {
		await this.switchTab( 'conversation' );

		await this.browserPage.click( 'button[name="comment_and_close"]' );

		// Delete the branch.
		await this.browserPage.waitFor( 'div.post-merge-message button[type="submit"]', { visible: true } );
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

