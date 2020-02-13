/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { DomManipulator } from '../../src/app/util';

describe( 'Util', () => {
	describe( 'DomManipulator', () => {
		describe( 'should rollback', () => {
			it( 'addEventListener', () => {
				const domManipulator = new DomManipulator();

				const callback = sinon.spy();

				domManipulator.addEventListener( document.body, 'click', callback );

				document.body.click();
				expect( callback.calledOnce, 'first call' ).to.be.true;

				domManipulator.rollback();

				document.body.click();
				expect( callback.calledOnce, 'second call' ).to.be.true;
			} );

			it( 'append', () => {
				const domManipulator = new DomManipulator();

				const element = document.createElement( 'div' );

				domManipulator.append( document.body, element );
				expect( element.parentNode ).to.equals( document.body );

				domManipulator.rollback();
				expect( element.parentNode ).to.be.null;
			} );
		} );
	} );
} );
