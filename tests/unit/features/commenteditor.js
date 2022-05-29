/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import CommentEditor from '../../../src/app/features/commenteditor';
import { GitHubPage } from '../../_util/githubpage';

describe( 'Features', () => {
	describe( 'CommentEditor', () => {
		beforeEach( () => {
			GitHubPage.setPageName( 'repo_issues' );
		} );

		describe( 'run()', () => {
			it( 'should create an editor', () => {
				CommentEditor.run();

				const { button, root } = GitHubPage.appendButton( { type: 'edit' } );

				const spy = sinon.spy( CommentEditor, 'createEditor' );

				button.click();

				expect( spy.callCount ).to.equals( 1 );

				const promise = spy.returnValues[ 0 ];

				return promise.then( editor => {
					expect( editor ).to.be.an.instanceOf( CommentEditor );
					expect( editor.dom.root ).to.equals( root );
				} );
			} );

			it( `should do nothing on action button without edit`, () => {
				const { button } = GitHubPage.appendButton( { type: 'edit' } );

				button.parentElement.querySelector( '.js-comment-edit-button' ).remove();

				const stub = sinon.stub( CommentEditor, 'createEditor' );
				expect( stub.called, 'no call before' ).to.be.false;

				button.click();

				expect( stub.called, 'no call after' ).to.be.false;
			} );

			it( 'should find existing editors', () => {
				// One main editor.
				GitHubPage.appendRoot();

				// Three comment editors.
				GitHubPage.appendRoot( { type: 'comment-edit' } );
				GitHubPage.appendRoot( { type: 'comment-code-line' } );
				GitHubPage.appendRoot( { type: 'comment-edit' } );

				const promise = CommentEditor.run();

				expect( promise ).to.be.an.instanceOf( Promise );
				return promise
					.then( editors => {
						expect( editors ).to.be.an.instanceOf( Array );
						expect( editors.length ).to.equals( 3 );
						expect( editors[ 0 ] ).to.an.instanceOf( CommentEditor );
						expect( editors[ 1 ] ).to.an.instanceOf( CommentEditor );
						expect( editors[ 2 ] ).to.an.instanceOf( CommentEditor );
					} )
					.catch( failOnCatch );
			} );

			function failOnCatch( err ) {
				expect.fail( err.message + '\n' + err.stack );
			}
		} );
	} );
} );
