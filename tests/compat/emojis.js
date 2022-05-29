/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const NewIssuePage = require( '../_pom/pages/newissuepage' );
const { expect } = require( 'chai' );

describe( 'Emojis', function() {
	this.timeout( 0 );

	it( 'should match the existing file', async () => {
		const page = await NewIssuePage.getPage();
		const emojis = await page.getEmojis();
		const currentEmojis = require( '../../src/app/data/emojis.json' );

		expect( emojis, `The contents of "src/app/data/emojis.json" don't match the emojis ` +
			`currently available in GitHub. Run "yarn run emojis" to update the file.` )
			.to.eql( currentEmojis );
	} );
} );
