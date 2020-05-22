/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import App from '../../src/app/app';
import Page from '../../src/app/page';
import router from '../../src/app/router';

import { GitHubPage } from '../_util/githubpage';

describe( 'App', () => {
	describe( 'run()', () => {
		beforeEach( 'reset page initialized by root.js', () => {
			GitHubPage.reset();
		} );

		it( 'should expose the Page', () => {
			expect( App ).to.have.property( 'page' ).instanceOf( Page );
		} );

		it( 'should run the router', () => {
			const stub = sinon.stub( router, 'run' );

			return App.run().then( () => {
				expect( stub.calledOnce ).to.be.true;
			} );
		} );
	} );
} );
