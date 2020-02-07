/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { TextExpander } from '../../../../src/app/plugins/autolinking';
import { createTestEditor, getDataRange } from '../../../_util/ckeditor';

describe( 'TextExpander', () => {
	let editor;

	before( 'create test editor', () => {
		return createTestEditor()
			.then( ret => ( { editor } = ret ) );
	} );

	describe( 'word()', () => {
		const tests = [
			[ 'one tw[o th]ree four', 'one [two three] four' ],
			[ 'one[ two ]three four', '[one two three] four' ],
			[ 'one t[]wo three four', 'one [two] three four' ],
			[ 'one two []three four', 'one two [three] four' ],
			[ 'one [two three] four', 'one [two three] four' ],
			[ '[]', '[]' ]
		];

		tests.forEach( ( [ before, after ], index ) => {
			it( `should expand (${ index + 1 })`, () => {
				const range = TextExpander.word( getDataRange( editor, before ) );

				let result = Array.from( after.replace( /[[\]]/g, '' ) );
				result.splice( range.end.offset, 0, ']' );
				result.splice( range.start.offset, 0, '[' );
				result = result.join( '' );

				expect( result ).to.equal( after );
			} );
		} );
	} );
} );
