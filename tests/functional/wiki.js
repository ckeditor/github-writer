/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const NewWikiPage = require( '../_pom/pages/newwikipage' );
const WikiPage = require( '../_pom/pages/wikipage' );

const { expect } = require( 'chai' );

describe( 'Wiki', function() {
	this.timeout( 0 );
	let page;

	after( 'should delete the wiki', async () => {
		if ( page instanceof WikiPage ) {
			await page.deleteWiki();
		}
	} );

	it( 'should create a new wiki', async () => {
		page = await NewWikiPage.getPage();

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

		expect( page ).to.be.an.instanceOf( WikiPage );

		expect( await page.getContentHtml() ).to.equals(
			'<p>Typing inside <strong>GitHub Writer</strong>.</p>\n' +
			`<p>Time stamp: ${ timestamp }.</p>` );
	} );
} );
