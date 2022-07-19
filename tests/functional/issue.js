/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const NewIssuePage = require( '../_pom/pages/newissuepage' );
const IssuePage = require( '../_pom/pages/issuepage' );
const { expect } = require( 'chai' );

describe( 'Issue', function() {
	this.timeout( 0 );
	let page;

	after( 'should delete the issue', async () => {
		if ( page instanceof IssuePage ) {
			await page.deleteIssue();
		}
		await page.waitForNavigation();
	} );

	it( 'should create a new issue', async () => {
		page = await NewIssuePage.getPage();

		const timestamp = ( new Date() ).toISOString();

		const title = `Testing (${ timestamp })`;
		await page.setTitle( title );

		const editor = await page.getMainEditor();
		await editor.type(
			'Typing inside [Ctrl+B]GitHub Writer[Ctrl+B].',
			'[Enter]',
			`Time stamp: ${ timestamp }.`
		);

		page = await editor.submit();
	} );

	it( 'should create a new comment', async () => {
		expect( page ).to.be.an.instanceOf( IssuePage );

		const timestamp = ( new Date() ).toISOString();

		const editor = await page.getNewCommentEditor();
		await editor.type(
			'Commenting with [Ctrl+B]GitHub Writer[Ctrl+B].',
			'[Enter]',
			`Time stamp: ${ timestamp }.` );

		await editor.submit();

		expect( await page.getCommentHtml( 1 ) ).to.equals(
			'<p dir="auto">Commenting with <strong>GitHub Writer</strong>.</p>\n' +
			`<p dir="auto">Time stamp: ${ timestamp }.</p>` );
	} );

	it( 'should edit the created comment', async () => {
		expect( page ).to.be.an.instanceOf( IssuePage );

		const timestamp = ( new Date() ).toISOString();

		const editor = await page.editComment( 1 );
		await editor.type(
			'[Ctrl+A][Delete]',
			'Editing with [Ctrl+B]GitHub Writer[Ctrl+B].',
			'[Enter]',
			`Time stamp: ${ timestamp }.`
		);

		await editor.submit();

		expect( await page.getCommentHtml( 1 ) ).to.equals(
			'<p dir="auto">Editing with <strong>GitHub Writer</strong>.</p>\n' +
			`<p dir="auto">Time stamp: ${ timestamp }.</p>` );
	} );

	it( 'should edit the created comment without prior hover', async () => {
		// (#285).
		expect( page ).to.be.an.instanceOf( IssuePage );

		const timestamp = ( new Date() ).toISOString();

		const editor = await page.editComment( 1, { skipHover: true } );
		await editor.type(
			'[Ctrl+A][Delete]',
			'Editing with [Ctrl+B]GitHub Writer[Ctrl+B].',
			'[Enter]',
			`Time stamp: ${ timestamp }.`
		);

		await editor.submit();

		expect( await page.getCommentHtml( 1 ) ).to.equals(
			'<p dir="auto">Editing with <strong>GitHub Writer</strong>.</p>\n' +
			`<p dir="auto">Time stamp: ${ timestamp }.</p>` );
	} );
} );
