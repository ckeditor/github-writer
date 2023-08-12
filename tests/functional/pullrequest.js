/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const FileEditPage = require( '../_pom/pages/fileeditpage' );
const NewPullRequestPage = require( '../_pom/pages/newpullrequestpage' );
const PullRequestPage = require( '../_pom/pages/pullrequestpage' );
const FORM_TYPE = require( '../_pom/formsubmittypes' );

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
		page = await FileEditPage.getPage( 'master/README.md' );

		const timestamp = ( new Date() ).toISOString();

		await page.appendCodeMirrorText( '[Enter]Typing inside [CtrlCmd+B]GitHub Writer[CtrlCmd+B].' );

		page = await page.submitPullRequest();

		await page.waitForNavigation();

		expect( page ).to.be.an.instanceOf( NewPullRequestPage );

		const editor = await page.getMainEditor();

		await editor.type(
			'Typing inside [CtrlCmd+B]GitHub Writer[CtrlCmd+B].',
			'[Enter]',
			`Time stamp: ${ timestamp }.`
		);

		page = await editor.submit( FORM_TYPE.NEW_PR );

		expect( page ).to.be.an.instanceOf( PullRequestPage );

		// expect( await page.getCommentHtml( 0 ) ).to.equals(
		// 	'<p>Typing inside <strong>GitHub Writer</strong>.</p>\n' +
		// 	`<p>Time stamp: ${ timestamp }.</p>` );
	} );

	it( 'should create a new comment', async () => {
		expect( page ).to.be.an.instanceOf( PullRequestPage );

		const timestamp = ( new Date() ).toISOString();

		const editor = await page.getNewCommentEditor();
		await editor.type(
			'Commenting with [CtrlCmd+B]GitHub Writer[CtrlCmd+B].',
			'[Enter]',
			`Time stamp: ${ timestamp }.`
		);

		await editor.submit( FORM_TYPE.PR_NEW_COMMENT );

		expect( await page.getCommentHtml( 0 ) ).to.equals(
			'<p dir="auto">Commenting with <strong>GitHub Writer</strong>.</p>\n' +
			`<p dir="auto">Time stamp: ${ timestamp }.</p>` );
	} );

	it.skip( 'should edit the created comment', async () => {
		expect( page ).to.be.an.instanceOf( PullRequestPage );

		const timestamp = ( new Date() ).toISOString();

		const editor = await page.editComment( 1 );
		await editor.type(
			'[CtrlCmd+A][Delete]',
			'Editing with [CtrlCmd+B]GitHub Writer[CtrlCmd+B].',
			'[Enter]',
			`Time stamp: ${ timestamp }.` );

		await editor.submit( FORM_TYPE.PR_EDIT_COMMENT );

		expect( await page.getCommentHtml( 0 ) ).to.equals(
			'<p dir="auto">Editing with <strong>GitHub Writer</strong>.</p>\n' +
			`<p dir="auto">Time stamp: ${ timestamp }.</p>` );
	} );

	it.skip( 'should add a code line comment', async () => {
		expect( page ).to.be.an.instanceOf( PullRequestPage );

		const timestamp = ( new Date() ).toISOString();

		const editor = await page.getLineCommentEditor( 1 );

		await editor.type(
			'Code line comment with [CtrlCmd+B]GitHub Writer[CtrlCmd+B].',
			'[Enter]',
			`Time stamp: ${ timestamp }.`
		);

		await editor.submit( FORM_TYPE.PR_CODE_LINE_COMMENT );

		expect( await page.getLineCommentHtml( 1, 0 ) ).to.equals(
			'<p dir="auto">Code line comment with <strong>GitHub Writer</strong>.</p>\n' +
			`<p dir="auto">Time stamp: ${ timestamp }.</p>` );
	} );

	it( 'should add a review comment', async () => {
		expect( page ).to.be.an.instanceOf( PullRequestPage );

		const timestamp = ( new Date() ).toISOString();

		const editor = await page.getReviewEditor();
		await editor.type(
			'Reviewing with [CtrlCmd+B]GitHub Writer[CtrlCmd+B].',
			'[Enter]',
			`Time stamp: ${ timestamp }.`
		);

		await editor.submit( FORM_TYPE.PR_REVIEW_COMMENT );

		// expect( await page.getCommentHtml( 2 ) ).to.equals(
		// 	'<p>Reviewing with <strong>GitHub Writer</strong>.</p>\n' +
		// 	`<p>Time stamp: ${ timestamp }.</p>` );
	} );
} );
