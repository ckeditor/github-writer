/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const FileEditPage = require( '../_pom/pages/fileeditpage' );
const NewPullRequestPage = require( '../_pom/pages/newpullrequestpage' );
const PullRequestPage = require( '../_pom/pages/pullrequestpage' );

const { expect } = require( 'chai' );

describe( 'Pull Request', function() {
	this.timeout( 0 );
	let page;

	after( 'should close the pull request and cleanup', async () => {
		if ( page instanceof PullRequestPage ) {
			await page.closePullRequest();
		}
	} );

	it( 'should create a new pull request', async () => {
		page = await FileEditPage.getPage( 'main/README.md' );

		const timestamp = ( new Date() ).toISOString();

		await page.appendText( `Time stamp: ${ timestamp }.` );

		page = await page.submitPullRequest();

		expect( page ).to.be.an.instanceOf( NewPullRequestPage );

		const editor = await page.getMainEditor();
		await editor.type(
			'Typing inside [Ctrl+B]GitHub Writer[Ctrl+B].',
			'[Enter]',
			`Time stamp: ${ timestamp }.`
		);

		page = await editor.submit();

		expect( page ).to.be.an.instanceOf( PullRequestPage );

		expect( await page.getCommentHtml( 0 ) ).to.equals(
			'<p dir="auto">Typing inside <strong>GitHub Writer</strong>.</p>\n' +
			`<p dir="auto">Time stamp: ${ timestamp }.</p>` );
	} );

	it( 'should create a new comment', async () => {
		expect( page ).to.be.an.instanceOf( PullRequestPage );

		const timestamp = ( new Date() ).toISOString();

		const editor = await page.getNewCommentEditor();
		await editor.type(
			'Commenting with [Ctrl+B]GitHub Writer[Ctrl+B].',
			'[Enter]',
			`Time stamp: ${ timestamp }.`
		);

		await editor.submit();

		expect( await page.getCommentHtml( 1 ) ).to.equals(
			'<p dir="auto">Commenting with <strong>GitHub Writer</strong>.</p>\n' +
			`<p dir="auto">Time stamp: ${ timestamp }.</p>` );
	} );

	it( 'should edit the created comment', async () => {
		expect( page ).to.be.an.instanceOf( PullRequestPage );

		const timestamp = ( new Date() ).toISOString();

		const editor = await page.editComment( 1 );
		await editor.type(
			'[Ctrl+A][Delete]',
			'Editing with [Ctrl+B]GitHub Writer[Ctrl+B].',
			'[Enter]',
			`Time stamp: ${ timestamp }.` );

		await editor.submit();

		expect( await page.getCommentHtml( 1 ) ).to.equals(
			'<p dir="auto">Editing with <strong>GitHub Writer</strong>.</p>\n' +
			`<p dir="auto">Time stamp: ${ timestamp }.</p>` );
	} );

	it( 'should add a code line comment', async () => {
		expect( page ).to.be.an.instanceOf( PullRequestPage );

		const timestamp = ( new Date() ).toISOString();

		const editor = await page.getLineCommentEditor( 1 );
		await editor.type(
			'Code line comment with [Ctrl+B]GitHub Writer[Ctrl+B].',
			'[Enter]',
			`Time stamp: ${ timestamp }.`
		);

		await editor.submit();

		expect( await page.getLineCommentHtml( 1, 0 ) ).to.equals(
			'<p dir="auto">Code line comment with <strong>GitHub Writer</strong>.</p>\n' +
			`<p dir="auto">Time stamp: ${ timestamp }.</p>` );
	} );

	it( 'should add a review comment', async () => {
		expect( page ).to.be.an.instanceOf( PullRequestPage );

		const timestamp = ( new Date() ).toISOString();

		const editor = await page.getReviewEditor();
		await editor.type(
			'Reviewing with [Ctrl+B]GitHub Writer[Ctrl+B].',
			'[Enter]',
			`Time stamp: ${ timestamp }.`
		);

		await editor.submit();

		expect( await page.getCommentHtml( 2 ) ).to.equals(
			'<p dir="auto">Reviewing with <strong>GitHub Writer</strong>.</p>\n' +
			`<p dir="auto">Time stamp: ${ timestamp }.</p>` );
	} );
} );
