/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @file Node script that updates the "src/app/data/emoji.json" file by retrieving it from GitHub.com.
 */

/* global __dirname */

// The test API is used to login and navigate through GitHub.com.
const NewIssuePage = require( '../tests/_pom/pages/newissuepage' );

const fs = require( 'fs' );
const path = require( 'path' );

updateEmojis();

async function updateEmojis() {
	console.log( 'Loading the "New Issue" page...' );
	const page = await NewIssuePage.getPage();

	console.log( `Retrieving emojis...` );
	const emojis = await page.getEmojis();

	console.log( 'Updating "src/app/data/emoji.json"...' );
	fs.writeFileSync( path.resolve( __dirname, '../src/app/data/emojis.json' ), JSON.stringify( emojis, null, '\t' ) );

	await page.browserPage.browser().close();

	console.log( 'Done!' );
}
