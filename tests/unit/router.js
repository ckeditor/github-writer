/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import router from '../../src/app/router';
import Editor from '../../src/app/editor/editor';
import NewIssueEditor from '../../src/app/features/newissueeditor';

import { GitHubPage } from '../_util/githubpage';
import { PageIncompatibilityError } from '../../src/app/modules/util';

describe( 'Router', () => {
	describe( 'run()', () => {
		it( 'should return a promise', () => {
			GitHubPage.appendRoot();

			const promise = router.run();

			return promise
				.catch( failOnCatch )
				.then( returnValues => {
					expect( promise ).to.be.an.instanceOf( Promise );
					expect( returnValues ).to.be.an( 'array' ).length( 0 );
				} );
		} );

		it( 'should run a feature', () => {
			sinon.stub( window, '__getLocation' ).returns( { pathname: '/org/repo/issues/new' } );
			GitHubPage.setPageName( 'repo_issues' );
			GitHubPage.appendRoot( { type: 'issue' } );

			return router.run()
				.catch( failOnCatch )
				.then( returnValues => {
					expect( returnValues ).to.be.an( 'array' ).length( 1 );
					expect( returnValues[ 0 ] ).to.be.an.instanceOf( NewIssueEditor );
				} );
		} );

		it( 'should reject on error', () => {
			sinon.stub( window, '__getLocation' ).returns( { pathname: '/org/repo/issues/new' } );
			GitHubPage.setPageName( 'repo_issues' );
			const root = GitHubPage.appendRoot( { type: 'issue' } );

			// Error caused by this.
			root.querySelector( 'textarea' ).remove();

			return router.run()
				.then( () => {
					expect.fail( 'the promise should reject' );
				} )
				.catch( err => {
					expect( err ).to.be.an.instanceOf( PageIncompatibilityError );
				} );
		} );
	} );

	describe( 'pjax', () => {
		it( 'should destroy editors before pjax', () => {
			const stub = sinon.stub( Editor, 'destroyEditors' );
			expect( stub.called, 'no call before' ).to.be.false;

			document.body.dispatchEvent( new CustomEvent( 'pjax:start', { bubbles: true } ) );

			expect( stub.calledOnce, 'one call after' ).to.be.true;
			expect( stub.firstCall.calledWith( document.body ) ).to.be.true;
		} );

		it( 'should re-scan after pjax', done => {
			const stub = sinon.stub( router, 'run' );
			expect( stub.called, 'no call before' ).to.be.false;

			document.body.dispatchEvent( new CustomEvent( 'pjax:end', { bubbles: true } ) );

			setTimeout( () => {
				expect( stub.calledOnce, 'one call after' ).to.be.true;
				done();
			}, 1 );
		} );
	} );
} );

function failOnCatch( err ) {
	expect.fail( err.message + '\n' + err.stack );
}
