/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const GitHubPage = require( '../githubpage' );
const { NewCommentEditor, CommentEditor } = require( '../editor' );

/**
 * Base page for pages that contain a timeline of comments, like issues and pull requests.
 */
class CommentsTimelinePage extends GitHubPage {
	/**
	 * Gets the editor used for new comments.
	 *
	 * @returns {Promise<MainEditor>} The editor.
	 */
	async getNewCommentEditor() {
		return await this.getEditorByRoot( '.js-new-comment-form', NewCommentEditor );
	}

	/**
	 * Opens the comment editing editor.
	 *
	 * @param {Number} index The comment index in the page.
	 * @param {Object} [options] Additional comment edit customizations.
	 * @param {Boolean} [options.skipHover=false] If set to `true` puppeteer will do pointer hover over
	 * the action button before clicking it.
	 * @return {Promise<CommentEditor>} The editor used to edit the comment.
	 */
	async editComment( index, options = { skipHover: false } ) {
		const root = ( await this.browserPage.$$( 'form.js-comment-update' ) )[ index ];

		const actionButton = await root.evaluateHandle( root =>
			root.closest( '.timeline-comment' ).querySelector( '.show-more-popover' )
				.parentElement.querySelector( 'summary[role=button]' ) );

		if ( options.skipHover !== true ) {
			actionButton.hover();
			await this.browserPage.waitForSelector( '.js-comment-edit-button' );
		}

		await actionButton.click();
		await this.hasElement( '.js-comment-edit-button' );

		const editButton = await actionButton.evaluateHandle( actionButton =>
			actionButton.parentElement.querySelector( '.dropdown-menu' ).querySelector( '.js-comment-edit-button' ) );

		await this.waitVisible( editButton );
		await editButton.click();
		await this.waitVisible( root );

		return await this.getEditorByRoot( root, CommentEditor );
	}

	/**
	 * Gets the HTML of the comment body.
	 *
	 * @param index {Number} The comment index in the page.
	 * @return {Promise<String>} The HTML.
	 */
	async getCommentHtml( index ) {
		// Wait for the comment to be available.
		await this.browserPage.waitForFunction( function getCommentHtmlWait( index ) {
			return !!document.querySelectorAll( '.timeline-comment.comment .js-comment-body' )[ index ];
		}, {}, index );

		return await this.browserPage.evaluate( function getCommentHtmlEval( index ) {
			const element = document.querySelectorAll( '.timeline-comment.comment .js-comment-body' )[ index ];
			return element.innerHTML.replace( /^\s+|\s+$/g, '' );
		}, index );
	}
}

module.exports = CommentsTimelinePage;

