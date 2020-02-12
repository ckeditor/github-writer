/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import App from '../../src/app/app';
import PageManager from '../../src/app/pagemanager';

import { GitHubPage } from '../_util/githubpage';

describe( 'App', () => {
	describe( 'run()', () => {
		beforeEach( 'reset page initialized by root.js', () => {
			GitHubPage.reset();
		} );

		it( 'should expose the PageManager and initialize it', () => {
			const stub = sinon.stub( PageManager.prototype, 'init' );

			App.run();

			expect( App ).to.have.property( 'pageManager' ).instanceOf( PageManager );
			expect( stub.calledOnce ).to.be.true;
		} );

		it( 'should throw and error on second call', () => {
			try {
				App.run();
				App.run();

				expect.fail( 'should have thrown an error and not reach this line' );
			} catch ( err ) {
				expect( err ).to.be.an.instanceOf( Error );
			}
		} );
	} );
} );
