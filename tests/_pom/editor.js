/*
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const util = require( './util' );

let messageCount = 0;

/**
 * Generic editor:
 * 	- It doesn't expect anything to happen after the form data is submitted.
 */
class Editor {
	/**
	 * Creates an editor.
	 *
	 * @param page {GitHubPage} The current page.
	 * @param id {String} The editor id.
	 */
	constructor( page, id ) {
		this.page = page;
		this.id = id;
	}

	async getCKEditorId() {
		if ( !this._ckeditorId ) {
			this._ckeditorId = await this.page.browserPage.$eval( `[data-github-writer-id="${ this.id }"]`, root => {
				return root.getAttribute( 'data-ckeditor-id' );
			} );
		}

		return this._ckeditorId;
	}

	/**
	 * Gets the CKEditor editable element of this editor.
	 *
	 * @return {Promise<?ElementHandle>} The editable element (<div>).
	 */
	async getEditable() {
		if ( !this._editable ) {
			const selector = `[data-github-writer-id="${ this.id }"] .ck-editor__editable`;
			const editable = this._editable = await this.page.browserPage.$( selector );

			if ( !editable ) {
				throw new Error( `Editor id "${ this.id }" was not found` );
			}
		}

		return this._editable;
	}

	/**
	 * Types text inside the CKEditor instance of this editor.
	 *
	 * @param text {...String} Texts to be typed. See util.type() for more information.
	 */
	async type( ...text ) {
		const editable = await this.getEditable();
		await util.type( editable, ...text );
	}

	/**
	 * Submits the form this editor is part of.
	 *
	 * @return {Promise<GitHubPage>} The current page.
	 */
	async submit() {
		const selector = `[data-github-writer-id="${ this.id }"] .btn-primary`;
		await this.page.browserPage.click( selector );
		return this.page;
	}

	/**
	 * Gets the data from the CKEditor instance of this editor.
	 *
	 * @return {Promise<String>}
	 */
	async getData() {
		return await this.exec( 'getData' );
	}

	/**
	 * Executes a command provided by the Messenger plugin of the CKEditor instance inside this editor.
	 *
	 * @param command {String} The command to be executed.
	 * @param args {...*} Arguments to be passed to the command.
	 * @return {Promise<*>} The valued returned.
	 */
	async exec( command, ...args ) {
		// Unique ID of this request.
		const thisRequestId = 'gw-tests-' + ( ++messageCount );
		const ckeditorId = await this.getCKEditorId();

		// Evaluates in the page a script that implements the Messenger plugin communication protocol.
		return await this.page.browserPage.evaluate( function( thisRequestId, editorId, command, args ) {
			const promise = new Promise( ( resolve, reject ) => {
				// For easier debugging, let's have a timer.
				const timeout = setTimeout( () => {
					window.removeEventListener( 'message', messageListener );
					reject( new Error( 'Editor.exec(): no response (timeout).' ) );
				}, 1000 );

				window.addEventListener( 'message', messageListener, { passive: true } );

				function messageListener( event ) {
					const { type, requestId, status, returnValue } = event.data;

					if ( type === 'CKEditor-Messenger-Response' && requestId === thisRequestId ) {
						clearTimeout( timeout );
						window.removeEventListener( 'message', messageListener );

						if ( status === 'ok' ) {
							resolve( returnValue );
						} else {
							reject( new Error( `Editor.exec(): request error (${ status }).` ) );
						}
					}
				}
			} );

			window.postMessage( {
				type: 'CKEditor-Messenger-Request',
				requestId: thisRequestId,
				editorId,
				command,
				args
			}, '*' );

			return promise;
		}, thisRequestId, ckeditorId, command, args );
	}
}

/**
 * Editor with behavior similar to the one used to create issues:
 * 	- It expects a new page to be loaded when the form is submitted.
 */
class MainEditor extends Editor {
	/**
	 * Submits the form and waits for the new page to be loaded.
	 *
	 * @return {Promise<GitHubPage>} The page loaded after submit.
	 */
	async submit() {
		await this.page.waitForNavigation( super.submit() );

		const GitHubPage = require( './githubpage' );
		return await GitHubPage.getCurrentPage();
	}
}

/**
 * Editor with behavior similar to the one used to create new comments in issues.
 * 	- It requires a "timeline" of comments in the page.
 */
class NewCommentEditor extends Editor {
	/**
	 * Submits the form and waits for the comment to show up in the list of comments.
	 *
	 * @return {Promise<GitHubPage>} The current page.
	 */
	async submit() {
		// Get the current number of comments.
		const commentsCount = await this.page.browserPage.evaluate( () => {
			const elements = document.querySelectorAll( '.timeline-comment.comment td.comment-body' );
			return elements.length;
		} );

		await super.submit();

		// Wait for the count of comments to increase.
		await this.page.browserPage.waitForFunction( function( expectedCount ) {
			const elements = document.querySelectorAll( '.timeline-comment.comment td.comment-body' );
			return elements.length === expectedCount;
		}, {}, commentsCount + 1 );

		return this.page;
	}
}

/**
 * Editor with behavior similar to the one used to edit comments in issues.
 * 	- It requires a "timeline" of comments in the page.
 */
class CommentEditor extends Editor {
	/**
	 * Submit the form and wait for the updated comment to be displayed.
	 *
	 * @return {Promise<IssuePage>}
	 */
	async submit() {
		await super.submit();

		// Wait for the count of comments to increase.
		await this.page.browserPage.waitForFunction( function( id ) {
			const commentBody = document
				// Editor root.
				.querySelector( `[data-github-writer-id="${ id }"]` )
				// Common ancestor.
				.closest( '.timeline-comment.comment' )
				// Comment body.
				.querySelector( 'td.comment-body' );

			// Check if the comment body is already visible.
			return ( commentBody.offsetParent !== null );
		}, {}, this.id );

		return this.page;
	}
}

/**
 * The editor used to add the first comment in a code line in PRs.
 */
class NewLineCommentEditor extends Editor {
	/**
	 * @param page {GitHubPage} The current page.
	 * @param id {String} The editor id.
	 * @param line {Number} The sequential line position in the diff list. It's not the line number in the file.
	 */
	constructor( page, id, line ) {
		super( page, id );

		this.line = line;
	}

	/**
	 * Submits the form and waits for the comment to show up in the list of comments.
	 *
	 * @return {Promise<GitHubPage>} The current page.
	 */
	async submit() {
		// Get the current number of comments.
		const commentsCount = await this.page.browserPage.evaluate( function submitBefore( position ) {
			const button = document.querySelector(
				`button.js-add-single-line-comment[data-position="${ position }"]` );
			const container = button
				.closest( 'tr' )
				.nextElementSibling
				.querySelector( '.js-comments-holder' );

			return container.querySelectorAll( '.review-comment-contents.js-suggested-changes-contents' ).length;
		}, this.line );

		await super.submit();

		// Wait for the count of comments to increase.
		await this.page.browserPage.waitForFunction( function submitAfter( position, expectedCount ) {
			const button = document.querySelector(
				`button.js-add-single-line-comment[data-position="${ position }"]` );
			const container = button
				.closest( 'tr' )
				.nextElementSibling
				.querySelector( '.js-comments-holder' );

			const count = container.querySelectorAll( '.review-comment-contents.js-suggested-changes-contents' ).length;

			return count === expectedCount;
		}, {}, this.line, commentsCount + 1 );

		return this.page;
	}
}

module.exports.Editor = Editor;
module.exports.MainEditor = MainEditor;
module.exports.NewCommentEditor = NewCommentEditor;
module.exports.CommentEditor = CommentEditor;
module.exports.NewLineCommentEditor = NewLineCommentEditor;
