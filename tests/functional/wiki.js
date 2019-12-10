/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

require( './root' );

const { By, Key, until } = require( 'selenium-webdriver' );
const { expect } = require( 'chai' );
const { login, getGitHubUrl, checkLoggedIn } = require( './util/util' );

describe( 'The "wiki" test suite', function() {
	// Stop on the first failure.
	this.bail( true );
	this.timeout( 0 );

	let driver;
	before( async () => ( driver = await login() ) );

	let pageCreated = false;

	after( 'should delete the page', async () => {
		if ( pageCreated ) {
			// Click the "Edit" button.
			await driver.findElement( By.css( '.gh-header-actions :nth-child(2)' ) ).click();

			// Wait until the delete button is loaded.
			await driver.wait( until.elementLocated( By.css( '.btn-danger' ) ), 10000 );

			// Click the delete button.
			await driver.findElement( By.css( '.btn-danger' ) ).click();

			// Confirm the alert.
			await driver.switchTo().alert().accept();

			// After deletion, we should be at the wiki home.
			await driver.wait( until.urlMatches( /\/wiki$/ ) );
		}
	} );

	it( 'should create a new page using the RTE editor', async () => {
		const timestamp = Date.now();
		const title = `Testing (${ timestamp })`;

		// Load the page.
		{
			await driver.get( getGitHubUrl( 'wiki/_new' ) );
			await checkLoggedIn();
		}

		// Check if the DOM looks like expected by the app.
		{
			const root = await driver.findElement( By.css( '#gollum-editor' ) );
			await checkDom( root );
		}

		// Type the title.
		{
			await driver.findElement( By.name( 'wiki[name]' ) ).sendKeys( title );
		}

		// Type inside the editor and submit the form.
		{
			// Wait for the RTE editor to be created.
			await driver.wait( until.elementLocated( By.css( '#gollum-editor div.github-rte-ckeditor' ) ), 10000 );

			// Retrieve the root element, containing the whole GH editing form. Using the same selector we use in the app.
			const rootElement = driver.findElement( By.css( '#gollum-editor' ) );

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

		// Check if the new page has been properly created.
		{
			await driver.wait( until.elementLocated( By.css( '.gh-header-title' ) ), 5000 );

			pageCreated = true;

			const domTitle = await driver.findElement( By.css( '.gh-header-title' ) ).getText();

			expect( domTitle ).to.equal( title );

			const domBody = driver.findElement( By.css( '.markdown-body' ) );

			const html = await driver.executeScript( domBody => {
				return domBody.innerHTML.replace( /^\s+|\s+$/g, '' );
			}, domBody );

			expect( html ).to.equal(
				'<p>Typing inside the <strong>RTE editor</strong>.</p>\n' +
				`<p>Time stamp: ${timestamp}.</p>` );
		}
	} );

	// Check if the page DOM matches the expectation of the app.
	async function checkDom( root ) {
		const dom = {
			rootElement: root,
			toolbarContainer: await root.findElement( By.css( '.comment-form-head' ) ),
			textarea: await root.findElement( By.css( 'textarea' ) ),
			panelsContainer: await root.findElement( By.css( '.previewable-comment-form' ) ),
			panels: {
				markdown: await root.findElement( By.css( '.previewable-comment-form > .write-content' ) ),
				preview: await root.findElement( By.css( '.previewable-comment-form > .preview-content' ) )
			},
			tabs: {
				write: await root.findElement( By.css( '.write-tab' ) )
			}
		};
		return dom;
	}
} );
