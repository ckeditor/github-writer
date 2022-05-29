/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
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
	 * @param index {Number} The comment index in the page.
	 * @return {Promise<CommentEditor>} The editor used to edit the comment.
	 */
	async editComment( index ) {
		const root = ( await this.browserPage.$$( 'form.js-comment-update' ) )[ index ];
		const editButton = await root.evaluateHandle( root =>
			root.closest( '.timeline-comment' ).querySelector( '.js-comment-edit-button' ) );
		const actionButton = await editButton.evaluateHandle( editButton =>
			editButton.closest( 'details-menu' ).previousElementSibling );

		await actionButton.click();
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
			return !!document.querySelectorAll( '.timeline-comment.comment td.comment-body' )[ index ];
		}, {}, index );

		return await this.browserPage.evaluate( function getCommentHtmlEval( index ) {
			const element = document.querySelectorAll( '.timeline-comment.comment td.comment-body' )[ index ];
			return element.innerHTML.replace( /^\s+|\s+$/g, '' );
		}, index );
	}
}

module.exports = CommentsTimelinePage;

