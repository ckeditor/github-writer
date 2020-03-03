/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../../src/app/editor';

describe( 'Editors', () => {
	beforeEach( () => {
		// Mute dev logging.
		sinon.stub( console, 'log' ).callsFake( ( ...args ) => {
			if ( !( args[ 1 ] instanceof Editor ) ) {
				console.log.wrappedMethod.apply( console, args );
			}
		} );
	} );
} );
