/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

require( './root' );

const { By, Key, until } = require( 'selenium-webdriver' );
const { expect } = require( 'chai' );
const { login, getGitHubUrl, checkLoggedIn } = require( './util/util' );

describe( 'The "pull request" test suite', function() {
	// Stop on the first failure.
	this.bail( true );
	this.timeout( 0 );

	let driver;
	before( async () => ( driver = await login() ) );

	let pullRequestCreated = false;

	after( 'should close the pull request and cleanup', async () => {
		if ( pullRequestCreated ) {
			// Close the PR.
			await driver.findElement( By.css( 'button[name="comment_and_close"]' ) ).click();

			// Delete the relative branch.
			await driver.wait( until.elementLocated( By.css( 'div.post-merge-message button[type="submit"]' ) ), 5000 );
			await driver.findElement( By.css( 'div.post-merge-message button[type="submit"]' ) ).click();

			// After delete, the "restore" button should be displayed, which confirms the cleanup.
			await driver.wait( until.elementLocated( By.css( 'form.pull-request-ref-restore' ) ), 5000 );
		}
	} );

	it( 'should create a new pull request using the RTE editor', async () => {
		const timestamp = ( new Date() ).toISOString();

		// Load the editing page.
		{
			await driver.get( getGitHubUrl( 'edit/master/README.md' ) );

			await checkLoggedIn();
		}

		// Make and edit and post the form.
		{
			// Take the last line inside the Code Mirror editor used by GH.
			const lastLine = await driver.findElement( By.css( '.CodeMirror-code > div:last-of-type' ) );

			// Type inside of it.
			await lastLine.sendKeys(
				Key.ARROW_DOWN,		// This should move to the end of the line.
				Key.ENTER,
				'Time stamp: ', timestamp, '.' );

			// Check the radio button that creates a pull request.
			await driver.findElement( By.css( 'input[value="quick-pull"]' ) ).click();

			// Submit the form.
			await driver.findElement( By.css( 'button#submit-file' ) ).click();
		}

		// Check if the DOM looks like expected by the app.
		{
			await driver.wait( until.elementLocated( By.css( 'form#new_pull_request' ) ), 5000 );

			const root = await driver.findElement( By.css( 'form#new_pull_request' ) );
			await checkDom( root );
		}

		// Type inside the editor and submit the form.
		{
			// Wait for the RTE editor to be created.
			await driver.wait( until.elementLocated( By.css( 'form#new_pull_request div.github-rte-ckeditor' ) ), 10000 );

			// Retrieve the root element, containing the whole GH editing form. Using the same selector we use in the app.
			const rootElement = driver.findElement( By.css( 'form#new_pull_request' ) );

			// Get the RTE editor editable.
			const editable = rootElement.findElement( By.css( 'div.github-rte-ckeditor > .ck-editor__editable' ) );

			// Type inside of it.
			await editable.sendKeys(
				'Typing inside the ', Key.CONTROL, 'b', Key.CONTROL, 'RTE editor', Key.CONTROL, 'b', Key.CONTROL, '.',
				Key.ENTER,
				'Time stamp: ', timestamp, '.' );

			// Submit the form.
			await driver.findElement( By.js( editable => {
				return editable.closest( 'form' ).querySelector( '.btn-primary' );
			}, editable ) ).click();
		}

		// Check if the new issue has been properly created.
		{
			await driver.wait( until.elementLocated( By.css( '.timeline-comment.comment td.comment-body' ) ), 5000 );

			pullRequestCreated = true;

			const commentBody = driver.findElement( By.css( '.timeline-comment.comment td.comment-body' ) );

			const html = await driver.executeScript( commentBody => {
				return commentBody.innerHTML.replace( /^\s+|\s+$/g, '' );
			}, commentBody );

			expect( html ).to.equal(
				'<p>Typing inside the <strong>RTE editor</strong>.</p>\n' +
				`<p>Time stamp: ${ timestamp }.</p>` );
		}
	} );

	it( 'should add a comment using the RTE editor', async () => {
		const timestamp = ( new Date() ).toISOString();

		// Check if the DOM looks like expected by the app.
		{
			const root = await driver.findElement( By.css( 'form.js-new-comment-form' ) );
			await checkDom( root );
		}

		// Type inside the editor and submit the form.
		{
			// Wait for the RTE editor to be created.
			await driver.wait( until.elementLocated( By.css( 'form.js-new-comment-form div.github-rte-ckeditor' ) ), 5000 );

			// Retrieve the root element, containing the whole GH editing form. Using the same selector we use in the app.
			const rootElement = driver.findElement( By.css( 'form.js-new-comment-form' ) );

			// Get the RTE editor editable.
			const editable = rootElement.findElement( By.css( 'div.github-rte-ckeditor > .ck-editor__editable' ) );

			// Type inside of it.
			await editable.sendKeys(
				'Comment using the ', Key.CONTROL, 'b', Key.CONTROL, 'RTE editor', Key.CONTROL, 'b', Key.CONTROL, '.',
				Key.ENTER,
				'Time stamp: ', timestamp, '.' );

			// Submit the form.
			await driver.findElement( By.js( editable => {
				return editable.closest( 'form' ).querySelector( '.btn-primary' );
			}, editable ) ).click();
		}

		// Check if the new issue has been properly created.
		{
			await driver.wait( until.elementLocated( By.js( () => {
				const elements = document.querySelectorAll( '.timeline-comment.comment td.comment-body' );
				return ( elements.length === 2 && elements[ 1 ] );
			} ) ), 10000 );

			const commentBody = driver.findElement( By.js( () => {
				return document.querySelectorAll( '.timeline-comment.comment td.comment-body' )[ 1 ];
			} ) );

			const html = await driver.executeScript( commentBody => {
				return commentBody.innerHTML.replace( /^\s+|\s+$/g, '' );
			}, commentBody );

			expect( html ).to.equal(
				'<p>Comment using the <strong>RTE editor</strong>.</p>\n' +
				`<p>Time stamp: ${ timestamp }.</p>` );
		}
	} );

	it( 'should edit the comment using the RTE editor', async () => {
		const timestamp = ( new Date() ).toISOString();
		let dom;

		// Refresh the page.
		{
			await driver.navigate().refresh();
		}

		// Check if the DOM looks like expected by the app.
		{
			// At this point, we have 2 comments in the page: main issue and comment.
			// We want the second one.
			const root = await driver.findElement( By.js( () => {
				return document.querySelectorAll( 'form.js-comment-update' )[ 1 ];
			} ) );
			dom = await checkDom( root, { includeEdit: true } );
		}

		// Click the "edit" button.
		{
			await dom.actionButton.click();
			await driver.wait( until.elementIsVisible( dom.editButton ) );
			await dom.editButton.click();
		}

		// Type inside the editor and submit the form.
		{
			// Wait for the RTE editor to be created.
			await driver.wait( until.elementLocated( By.js( root => {
				return root.querySelector( 'div.github-rte-ckeditor' );
			}, dom.rootElement ) ), 5000 );

			// Get the RTE editor editable.
			const editable = await dom.rootElement.findElement( By.css( 'div.github-rte-ckeditor > .ck-editor__editable' ) );
			await editable.click();

			// This is the only reliable way to reset the editor contents. Unfortunately sending `ctrl+a` + `delete` doesn't work.
			await driver.executeScript( () => {
				window.postMessage( { type: 'GitHub-RTE-Reset-Editor' } );
			} );

			// Type inside of it.
			await editable.sendKeys(
				// Select all. (Not working)
				// editable.clear() also not working.
				// Key.CONTROL, 'a', Key.CONTROL,
				// // Delete.
				// Key.BACK_SPACE,
				// Type.
				'Editing comment using the ', Key.CONTROL, 'b', Key.CONTROL, 'RTE editor', Key.CONTROL, 'b', Key.CONTROL, '.',
				Key.ENTER,
				'Time stamp: ', timestamp, '.' );

			// Submit the form.
			await driver.findElement( By.js( editable => {
				return editable.closest( 'form' ).querySelector( '.btn-primary' );
			}, editable ) ).click();
		}

		// Check if the comment has been properly updated.
		{
			const commentBody = await driver.findElement( By.js( () => {
				const elements = document.querySelectorAll( '.timeline-comment.comment td.comment-body' );
				return elements[ elements.length - 1 ];
			} ) );

			// Let's give time for the comment edit to be save until the content of the comment contains the new timestamp.
			await driver.wait( until.elementTextContains( commentBody, timestamp ) );

			const html = await driver.executeScript( commentBody => {
				return commentBody.innerHTML.replace( /^\s+|\s+$/g, '' );
			}, commentBody );

			expect( html ).to.equal(
				'<p>Editing comment using the <strong>RTE editor</strong>.</p>\n' +
				`<p>Time stamp: ${ timestamp }.</p>` );
		}
	} );

	// Check if the page DOM matches the expectation of the app.
	async function checkDom( root, options = { includeEdit: false } ) {
		const toolbar = await root.findElement( By.css( 'markdown-toolbar' ) );
		const dom = {
			rootElement: root,
			toolbar,
			textarea: await root.findElement( By.css( '#' + await toolbar.getAttribute( 'for' ) ) ),
			panelsContainer: await root.findElement( By.css( '.previewable-comment-form' ) ),
			panels: {
				markdown: await root.findElement( By.css( '.previewable-comment-form > file-attachment' ) ),
				preview: await driver.findElement( By.js( root => {
					// Logic used in markdowneditor.js.
					return root.querySelector( '.previewable-comment-form > .js-preview-panel' ) ||
						root.querySelector( '.previewable-comment-form > .preview-content' );
				}, root ) )
			},
			tabs: {
				write: await root.findElement( By.css( '.write-tab' ) )
			}
		};

		if ( options.includeEdit ) {
			// Logic from pagemanager.js to retrieve the action and edit buttons.
			dom.editButton = await driver.findElement( By.js( root => {
				return root.closest( '.timeline-comment' ).querySelector( '.js-comment-edit-button' );
			}, root ) );
			dom.actionButton = await driver.findElement( By.js( editButton => {
				return editButton.closest( 'details-menu' ).previousElementSibling;
			}, dom.editButton ) );
		}

		return dom;
	}
} );
