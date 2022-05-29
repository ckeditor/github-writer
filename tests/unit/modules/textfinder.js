/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import TextFinder from '../../../src/app/modules/textfinder';
import { createTestEditor, getDataPosition, getDataRange } from '../../_util/ckeditor';

describe( 'Modules', () => {
	describe( 'TextFinder', () => {
		let editor, model, root;

		before( 'create test editor', () => {
			return createTestEditor()
				.then( ret => ( { editor, model, root } = ret ) );
		} );

		describe( 'texts', () => {
			it( 'should be defined on class initialization', () => {
				const finder = new TextFinder();
				expect( finder.texts ).to.be.an( 'array' );
			} );
		} );

		describe( 'findWordAtPosition', () => {
			const tests = [
				[ '|one two three', 'one' ],
				[ 'one| two three', 'one' ],
				[ 'one |two three', 'two' ],
				[ 'one tw|o three', 'two' ],
				[ 'one two| three', 'two' ],
				[ 'one tw|o, three', 'two,' ],
				[ 'one two,| three', 'two,' ],
				[ 'one two three|', 'three' ],
				[ '|', null ]
			];

			tests.forEach( ( [ data, word ], index ) => {
				it( `should find word (${ index + 1 })`, () => {
					const finder = new TextFinder();
					finder.findWordAtPosition( getDataPosition( editor, data ) );

					expect( finder.texts ).to.have.lengthOf( word ? 1 : 0 );

					if ( word ) {
						expect( finder.texts[ 0 ].text ).to.equal( word );

						// Get the expected offset of the word in the data.
						const offset = data.replace( '|', '' ).match( word ).index;

						expect( finder.texts[ 0 ].range.start.offset ).to.equal( offset );
						expect( finder.texts[ 0 ].range.end.offset ).to.equal( offset + word.length );
					}
				} );
			} );

			it( `should not add the same word twice`, () => {
				const finder = new TextFinder();

				editor.setData( 'one two three' );

				// Find "one".
				finder.findWordAtPosition(
					model.createPositionFromPath( root, [ 0, 1 ] )
				);

				// Find "three".
				finder.findWordAtPosition(
					model.createPositionFromPath( root, [ 0, 10 ] )
				);

				// Should not find "one" again.
				finder.findWordAtPosition(
					model.createPositionFromPath( root, [ 0, 2 ] )
				);

				expect( finder.texts ).to.have.lengthOf( 2 );

				expect( finder.texts.map( textInfo => textInfo.text ) ).to.deep.equal( [ 'one', 'three' ] );
			} );
		} );

		describe( 'findInRange', () => {
			it( `should find text in range`, () => {
				const finder = new TextFinder();
				const range = getDataRange( editor, 'one tw[o thr]ee' );

				finder.findInRange( range );

				expect( finder.texts ).to.have.lengthOf( 1 );

				expect( finder.texts[ 0 ].text ).to.equal( 'o thr' );

				// Get the expected offset of the word in the data.
				expect( finder.texts[ 0 ].range.start.path ).to.deep.equal( [ 0, 6 ] );
			} );

			it( `should find text in range with inline element`, () => {
				const finder = new TextFinder();

				editor.setData( 'one two\nthree' );
				const range = model.createRange(
					// '[one two\nthr]ee'
					model.createPositionFromPath( root, [ 0, 0 ] ),
					model.createPositionFromPath( root, [ 0, 11 ] )
				);

				finder.findInRange( range );

				expect( finder.texts ).to.have.lengthOf( 2 );

				expect( finder.texts[ 0 ].text ).to.equal( 'one two' );
				expect( finder.texts[ 0 ].range.start.path ).to.deep.equal( [ 0, 0 ] );
				expect( finder.texts[ 0 ].range.end.path ).to.deep.equal( [ 0, 7 ] );

				expect( finder.texts[ 1 ].text ).to.equal( 'thr' );
				expect( finder.texts[ 1 ].range.start.path ).to.deep.equal( [ 0, 8 ] );
				expect( finder.texts[ 1 ].range.end.path ).to.deep.equal( [ 0, 11 ] );
			} );

			it( `should find text in range across block elements`, () => {
				const finder = new TextFinder();

				editor.setData( 'one two\n\nthree\nfour\n\nfive' );
				const range = model.createRange(
					// '[one two\n\nthree\nfour\n\nfi]ve'
					model.createPositionFromPath( root, [ 0, 0 ] ),
					model.createPositionFromPath( root, [ 2, 2 ] )
				);

				finder.findInRange( range );

				expect( finder.texts ).to.have.lengthOf( 4 );

				expect( finder.texts[ 0 ].text ).to.equal( 'one two' );
				expect( finder.texts[ 0 ].range.start.path ).to.deep.equal( [ 0, 0 ] );
				expect( finder.texts[ 0 ].range.end.path ).to.deep.equal( [ 0, 7 ] );

				expect( finder.texts[ 1 ].text ).to.equal( 'three' );
				expect( finder.texts[ 1 ].range.start.path ).to.deep.equal( [ 1, 0 ] );
				expect( finder.texts[ 1 ].range.end.path ).to.deep.equal( [ 1, 5 ] );

				expect( finder.texts[ 2 ].text ).to.equal( 'four' );
				expect( finder.texts[ 2 ].range.start.path ).to.deep.equal( [ 1, 6 ] );
				expect( finder.texts[ 2 ].range.end.path ).to.deep.equal( [ 1, 10 ] );

				expect( finder.texts[ 3 ].text ).to.equal( 'fi' );
				expect( finder.texts[ 3 ].range.start.path ).to.deep.equal( [ 2, 0 ] );
				expect( finder.texts[ 3 ].range.end.path ).to.deep.equal( [ 2, 2 ] );
			} );

			it( `should find nothing if no texts in range`, () => {
				const finder = new TextFinder();

				editor.setData( '---' );
				const range = model.createRange(
					// '[<horizontalLine>]'
					model.createPositionFromPath( root, [ 0 ] ),
					model.createPositionFromPath( root, [ 1 ] )
				);

				finder.findInRange( range );

				expect( finder.texts ).to.have.lengthOf( 0 );
			} );
		} );
	} );
} );
