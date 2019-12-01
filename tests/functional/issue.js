/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { By, Key, until } = require( 'selenium-webdriver' );
const { buildDriver, getGitHubUrl } = require( './util/util' );
const credentials = require( '../config' ).github.credentials;

const { expect } = require( 'chai' );

describe( 'This test suite', () => {
	const driver = buildDriver();

	before( async () => {
		await driver.get( 'https://github.com/login' );
		await driver.findElement( By.name( 'login' ) ).sendKeys( credentials.name );
		await driver.findElement( By.name( 'password' ) ).sendKeys( credentials.password, Key.ENTER );
		await driver.wait( until.elementLocated( By.css( `meta[name="user-login"][content="${ credentials.name }"]` ) ) );
	} );

	after( () => driver.quit() );

	it( 'should create a new issue using the RTE editor', async () => {
		const timestamp = ( new Date() ).toISOString();
		const title = `Testing (${ timestamp })`;
		const dom = {};

		// Load the page.
		{
			await driver.get( getGitHubUrl( 'issues/new' ) );

			// Be sure that we're still properly logged in.
			await driver.wait( until.elementLocated( By.css( `meta[name="user-login"][content="${ credentials.name }"]` ) ) );
		}

		// Check if the DOM looks like expected by the app.
		{
			const root = dom.rootElement = await driver.findElement( By.css( '.timeline-comment:not(.comment)' ) );
			dom.toolbar = await root.findElement( By.css( 'markdown-toolbar' ) );
			dom.textarea = await root.findElement( By.css( '#' + await dom.toolbar.getAttribute( 'for' ) ) );
			dom.panelsContainer = await root.findElement( By.css( '.previewable-comment-form' ) );
			dom.panels = {
				markdown: await root.findElement( By.css( '.previewable-comment-form > file-attachment' ) ),
				preview: await root.findElement( By.css( '.previewable-comment-form > .js-preview-panel' ) )
			};
			dom.tabs = {
				write: await root.findElement( By.css( '.write-tab' ) )
			};
		}

		// Type the issue title.
		{
			await driver.findElement( By.name( 'issue[title]' ) ).sendKeys( title );
		}

		// Type inside the editor and submit the form.
		{
			// Wait for the RTE editor to be created.
			await driver.wait( until.elementLocated( By.css( '.timeline-comment:not(.comment) div.github-rte-ckeditor' ) ) );

			// Retrieve the root element, containing the whole GH editing form. Using the same selector we use in the app.
			const rootElement = driver.findElement( By.css( '.timeline-comment:not(.comment)' ) );

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
			await driver.wait( until.elementLocated( By.css( '.timeline-comment.comment td.comment-body' ) ), 10000 );

			const title = driver.findElement( By.css( '.js-issue-title' ) ).getText();

			expect( title ).to.equal( title );

			const commentBody = driver.findElement( By.css( '.timeline-comment.comment td.comment-body' ) );

			const html = await driver.executeScript( commentBody => {
				return commentBody.innerHTML.replace( /^\s+|\s+$/g, '' );
			}, commentBody );

			expect( html ).to.equal(
				'<p>Typing inside the <strong>RTE editor</strong>.</p>\n' +
				`<p>Time stamp: ${ timestamp }.</p>` );
		}

		// Delete the issue.
		{
			await driver.findElement( By.css( '.discussion-sidebar-item svg.octicon-trashcan' ) ).click();
			await driver.findElement( By.css( 'button[name="verify_delete"]' ) ).click();

			// After deletion, we should be at the issues list page.
			await driver.wait( until.urlMatches( /\/issues$/ ) );
		}
	} );
} );
