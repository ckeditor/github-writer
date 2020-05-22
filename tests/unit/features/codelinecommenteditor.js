/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import CodeLineCommentEditor from '../../../src/app/features/codelinecommenteditor';
import { GitHubPage } from '../../_util/githubpage';

describe( 'Features', () => {
	describe( 'CodeLineCommentEditor', () => {
		let addEventListenerSpy;

		before( () => {
			addEventListenerSpy = sinon.spy( document, 'addEventListener' ).withArgs( 'inlinecomment:focus' );
		} );

		beforeEach( () => {
			GitHubPage.setPageName( 'repo_pulls' );
		} );

		describe( 'run()', () => {
			it( 'should create an editor', () => {
				const { button, root } = GitHubPage.appendButton( { type: 'code-line-comment' } );

				const spy = sinon.spy( CodeLineCommentEditor, 'createEditor' );

				CodeLineCommentEditor.run();
				button.click();

				expect( spy.callCount ).to.equals( 1 );

				const promise = spy.returnValues[ 0 ];

				return promise.then( editor => {
					expect( editor ).to.be.an.instanceOf( CodeLineCommentEditor );
					expect( editor.dom.root ).to.equals( root );
				} );
			} );

			it( 'should add just one event listener', () => {
				CodeLineCommentEditor.run();
				CodeLineCommentEditor.run();

				expect( addEventListenerSpy.callCount ).to.equals( 1 );
			} );

			it( 'should click the write tab after creation (code line editor)', done => {
				const { button } = GitHubPage.appendButton( { type: 'code-line-comment' } );

				const writeTab = document.querySelector( '.write-tab' );
				const stub = writeTab.click; // Stubbed by GitHubPage.

				button.click();

				setTimeout( () => {
					expect( stub.called ).to.be.true;
					done();
				}, 0 );
			} );
		} );
	} );
} );
