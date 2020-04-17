/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ListFilter from '../../../src/app/modules/listfilter';

describe( 'Modules', () => {
	describe( 'ListFilter', () => {
		it( 'should return the whole list for empty query', () => {
			const filter = new ListFilter();

			filter.addItem( 'Item 1' );
			filter.addItem( 'Item 2' );

			const items = filter.query( '' );

			expect( items ).to.be.an( 'array' ).with.lengthOf( 2 );
			expect( items[ 0 ].name ).to.equals( 'Item 1' );
			expect( items[ 1 ].name ).to.equals( 'Item 2' );
		} );

		it( 'should return the item properties', () => {
			const filter = new ListFilter();

			filter.addItem( 'Item 1' );
			filter.addItem( 'Item 2', [ 'Rec 2' ] );
			filter.addItem( 'Item 3', [ 'Rec 3' ], { prop: 3 } );

			const items = filter.query( '' );

			expect( items[ 0 ] ).to.eql( { name: 'Item 1', records: undefined, data: undefined } );
			expect( items[ 1 ] ).to.eql( { name: 'Item 2', records: [ 'Rec 2' ], data: undefined } );
			expect( items[ 2 ] ).to.eql( { name: 'Item 3', records: [ 'Rec 3' ], data: { prop: 3 } } );
		} );

		describe( 'queries', () => {
			const filter = new ListFilter();

			filter.addItem( 'Ball', null, 1 );
			filter.addItem( 'Tree', [ 'Square Ball', 'Circle Ball', 'Ball Tree' ], 2 );
			filter.addItem( 'Ball Tree', [ 'Square', 'Circle' ], 3 );
			filter.addItem( 'Circle', [ 'Square', 'Tree' ], 4 );
			filter.addItem( 'Tree Square Ball Circle', [ 'Square Ball Tree' ], 5 );

			[
				[ 'circle', [ 3, 4, 2, 5 ] ],
				[ 'square', [ 3, 4, 2, 5 ] ],
				[ 'ball', [ 1, 3, 2, 5 ] ],
				[ 'ba', [ 1, 3, 2, 5 ] ],
				[ 'ci', [ 4, 2, 3, 5 ] ],
				[ 'all', [ 1, 2, 3, 5 ] ],
				[ 'bt', [ 2, 3, 5 ] ],
				[ 'tsc', [ 5 ] ]
			].forEach( ( [ query, expected ] ) => {
				it( query, () => {
					const items = filter.query( query );
					const results = items.map( item => item.data );

					expect( results.join( ', ' ) ).to.eql( expected.join( ', ' ) );
				} );
			} );
		} );
	} );
} );
