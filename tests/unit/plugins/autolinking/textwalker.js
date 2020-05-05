/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { TextWalker } from '../../../../src/app/plugins/autolinking';
import { createTestEditor } from '../../../_util/ckeditor';

describe( 'Plugins', () => {
	describe( 'AutoLinking', () => {
		describe( 'TextWalker', () => {
			const defaultData = 'AB CD';

			let editor, model, root;
			let dirty = false;

			before( 'create test editor', () => {
				return createTestEditor( defaultData )
					.then( ret => ( { editor, model, root } = ret ) );
			} );

			beforeEach( 'reset the editor data', () => {
				if ( dirty ) {
					editor.setData( defaultData );
					dirty = false;
				}
			} );

			function setEditorData( data ) {
				editor.setData( data );
				dirty = true;

				// This is to ensure that the model looks like we want it to be (e.g. no missing plugins in tests).
				expect( editor.getData() ).to.equal( data );
			}

			describe( 'position', () => {
				it( 'should start with startPosition', () => {
					const startPosition = model.createPositionFromPath( root, [ 0, 0 ] );
					const walker = new TextWalker( { startPosition } );

					expect( walker.position.isEqual( startPosition ) ).to.be.true;
				} );

				it( 'should move with char()', () => {
					const startPosition = model.createPositionFromPath( root, [ 0, 0 ] );
					const walker = new TextWalker( { startPosition } );

					walker.char();

					expect( walker.position.offset ).to.equal( startPosition.offset + 1 );
				} );
			} );

			describe( 'char()', () => {
				it( 'should walk forward from start', () => {
					const startPosition = model.createPositionFromPath( root, [ 0, 0 ] );
					const walker = new TextWalker( { startPosition, direction: 'forward' } );

					expect( walker.char() ).to.equals( 'A' );
					expect( walker.char() ).to.equals( 'B' );
					expect( walker.char() ).to.equals( ' ' );
					expect( walker.char() ).to.equals( 'C' );
					expect( walker.char() ).to.equals( 'D' );
					expect( walker.char() ).to.equals( null );
					expect( walker.char() ).to.equals( null );
				} );

				it( 'should walk backward from end', () => {
					const startPosition = model.createPositionFromPath( root, [ 0, 5 ] );
					const walker = new TextWalker( { startPosition, direction: 'backward' } );

					expect( walker.char() ).to.equals( 'D' );
					expect( walker.char() ).to.equals( 'C' );
					expect( walker.char() ).to.equals( ' ' );
					expect( walker.char() ).to.equals( 'B' );
					expect( walker.char() ).to.equals( 'A' );
					expect( walker.char() ).to.equals( null );
					expect( walker.char() ).to.equals( null );
				} );

				it( 'should walk forward from start by default', () => {
					const startPosition = model.createPositionFromPath( root, [ 0, 0 ] );
					const walker = new TextWalker( { startPosition } );

					expect( walker.char() ).to.equals( 'A' );
					expect( walker.char() ).to.equals( 'B' );
				} );

				it( 'should walk through styled text', () => {
					setEditorData( 'AB**CD**E' );

					const startPosition = model.createPositionFromPath( root, [ 0, 1 ] );
					const walker = new TextWalker( { startPosition } );

					expect( walker.char() ).to.equals( 'B' );
					expect( walker.char() ).to.equals( 'C' );
					expect( walker.char() ).to.equals( 'D' );
					expect( walker.char() ).to.equals( 'E' );
				} );

				it( 'should stop on inline element', () => {
					setEditorData( 'ABC  \nDE' );

					const startPosition = model.createPositionFromPath( root, [ 0, 1 ] );
					const walker = new TextWalker( { startPosition } );

					expect( walker.char() ).to.equals( 'B' );
					expect( walker.char() ).to.equals( 'C' );
					expect( walker.char() ).to.equals( null );
				} );

				it( 'should stop on parent end', () => {
					setEditorData( 'ABC\n\nDE' );

					const startPosition = model.createPositionFromPath( root, [ 0, 1 ] );
					const walker = new TextWalker( { startPosition } );

					expect( walker.char() ).to.equals( 'B' );
					expect( walker.char() ).to.equals( 'C' );
					expect( walker.char() ).to.equals( null );
				} );

				it( 'should stop on parent start', () => {
					setEditorData( 'ABC\n\nDE' );

					const startPosition = model.createPositionFromPath( root, [ 1, 2 ] );
					const walker = new TextWalker( { startPosition, direction: 'backward' } );

					expect( walker.char() ).to.equals( 'E' );
					expect( walker.char() ).to.equals( 'D' );
					expect( walker.char() ).to.equals( null );
				} );

				it( 'should do nothing on empty content', () => {
					setEditorData( '' );

					const startPosition = model.createPositionFromPath( root, [ 0, 0 ] );
					const walker = new TextWalker( { startPosition } );

					expect( walker.char() ).to.equals( null );
				} );
			} );

			describe( 'word()', () => {
				it( 'should walk forward by default', () => {
					const startPosition = model.createPositionFromPath( root, [ 0, 0 ] );
					const boundary = TextWalker.word( startPosition );

					expect( boundary.parent ).to.equals( startPosition.parent );
					expect( boundary.offset ).to.equals( 2 );
				} );

				it( 'should walk forward', () => {
					const startPosition = model.createPositionFromPath( root, [ 0, 0 ] );
					const boundary = TextWalker.word( startPosition, 'forward' );

					expect( boundary.parent ).to.equals( startPosition.parent );
					expect( boundary.offset ).to.equals( 2 );
				} );

				it( 'should walk backward', () => {
					const startPosition = model.createPositionFromPath( root, [ 0, 5 ] );
					const boundary = TextWalker.word( startPosition, 'backward' );

					expect( boundary.parent ).to.equals( startPosition.parent );
					expect( boundary.offset ).to.equals( 3 );
				} );

				it( 'should stop on boundary chars when moving forward', () => {
					setEditorData( '01 34. 78, 12; 56: ¿01? ¡56! 90' );

					testAt( 3 );
					testAt( 7 );
					testAt( 11 );
					testAt( 15 );
					testAt( 20 );
					testAt( 25 );

					function testAt( startOffset ) {
						const startPosition = model.createPositionFromPath( root, [ 0, startOffset ] );
						const boundary = TextWalker.word( startPosition );

						expect( boundary.parent ).to.equals( startPosition.parent );
						expect( boundary.offset ).to.equals( startOffset + 2 );
					}
				} );

				it( 'should stop on boundary chars when moving backward', () => {
					setEditorData( '01 ¿45? ¡90! 34' );

					testAt( 6 );
					testAt( 11 );

					function testAt( startOffset ) {
						const startPosition = model.createPositionFromPath( root, [ 0, startOffset ] );
						const boundary = TextWalker.word( startPosition, 'backward' );

						expect( boundary.parent ).to.equals( startPosition.parent );
						expect( boundary.offset ).to.equals( startOffset - 2 );
					}
				} );

				it( 'should not move further', () => {
					const startPosition = model.createPositionFromPath( root, [ 0, 0 ] );
					const boundary = TextWalker.word( startPosition );

					expect( TextWalker.word( boundary ).isEqual( boundary ) ).to.be.true;
				} );

				it( 'should not move further when hitting boundary character', () => {
					setEditorData( '01 34. 78' );

					const startPosition = model.createPositionFromPath( root, [ 0, 3 ] );
					const boundary = TextWalker.word( startPosition );

					expect( TextWalker.word( boundary ).isEqual( boundary ) ).to.be.true;
				} );
			} );
		} );
	} );
} );
