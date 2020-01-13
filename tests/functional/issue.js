/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

require( './root' );

const { By, Key, until } = require( 'selenium-webdriver' );
const { expect } = require( 'chai' );
const { login, getGitHubUrl, checkLoggedIn } = require( './util/util' );

describe( 'The "issue" test suite', function() {
	// Stop on the first failure.
	this.bail( true );
	this.timeout( 0 );

	let driver;
	before( async () => ( driver = await login() ) );

	let issueCreated = false;

	after( 'should delete the issue', async () => {
		if ( issueCreated ) {
			await driver.findElement( By.css( '.discussion-sidebar-item svg.octicon-trashcan' ) ).click();
			await driver.findElement( By.css( 'button[name="verify_delete"]' ) ).click();

			// After deletion, we should be at the issues list page.
			await driver.wait( until.urlMatches( /\/issues$/ ) );
		}
	} );

	it( 'should create a new issue using the RTE editor', async () => {
		const timestamp = Date.now();
		const title = `Testing (${ timestamp })`;

		// Load the page.
		{
			await driver.get( getGitHubUrl( 'issues/new' ) );

			await checkLoggedIn();
		}

		// Check if the DOM looks like expected by the app.
		{
			const root = await driver.findElement( By.css( 'form#new_issue' ) );
			await checkDom( root );
		}

		// Type the issue title.
		{
			await driver.findElement( By.name( 'issue[title]' ) ).sendKeys( title );
		}

		// Type inside the editor and submit the form.
		{
			// Wait for the RTE editor to be created.
			await driver.wait( until.elementLocated( By.css( 'form#new_issue div.github-rte-ckeditor' ) ), 10000 );

			// Retrieve the root element, containing the whole GH editing form. Using the same selector we use in the app.
			const rootElement = driver.findElement( By.css( 'form#new_issue' ) );

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

			issueCreated = true;

			const domTitle = await driver.findElement( By.css( '.js-issue-title' ) ).getText();

			expect( domTitle ).to.equal( title );

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
			// At this point, we have 2 comments in the page (each 2 forms): main issue and comment.
			// We want the first for of the second one... indexes: ( 0, 1 ), ( *2*, 3 )
			const root = await driver.findElement( By.js( () => {
				return document.querySelectorAll( 'form.js-comment-update' )[ 2 ];
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

			// This is the only reliable way to reset the editor contents. Unfortunally sending `ctrl+a` + `delete` doesn't work.
			await driver.executeScript( () => {
				window.postMessage( { type: 'GitHub-RTE-Reset-Editor' } );
			} );

			// Get the RTE editor editable.
			const editable = await dom.rootElement.findElement( By.css( 'div.github-rte-ckeditor > .ck-editor__editable' ) );

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
