/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import languagesObject from '../../../src/app/modules/languages';

describe( 'Modules', () => {
	describe( 'Languages', () => {
		it( 'languages', () => {
			expect( languagesObject.languages ).to.be.an( 'object' );

			Object.values( languagesObject.languages ).forEach( value => {
				expect( value ).to.be.an( 'array' ).not.empty;
			} );
		} );

		it( 'aliases', () => {
			expect( languagesObject.aliases ).to.be.an( 'object' );

			Object.values( languagesObject.aliases ).forEach( value => {
				expect( value ).to.be.a( 'string' ).not.empty;
			} );
		} );

		it( 'config', () => {
			expect( languagesObject.config ).to.be.an( 'array' );

			languagesObject.config.forEach( entry => {
				expect( entry.language ).to.be.a( 'string' ).not.empty;
				expect( entry.label ).to.be.a( 'string' ).not.empty;
			} );

			expect( languagesObject.config[ 0 ] ).to.eql( { language: 'plaintext', label: 'Plain Text', class: '' } );
		} );

		it( 'searchSource', () => {
			expect( languagesObject.searchSource ).to.be.a( 'string' );
			expect( languagesObject.searchSource ).to.not.match( /^(?!>([^,|]+)(?:\||(?:,[^|]+\|))\1$)/gmi );
		} );

		it( 'languagesCount', () => {
			expect( languagesObject.languagesCount ).to.be.a( 'number' ).greaterThan( 100 );
			expect( languagesObject.languagesCount ).to.equals( Object.keys( languagesObject.languages ).length );
		} );
	} );
} );
