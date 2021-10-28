/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import NewInlineCommentEditor from '../../../src/app/features/newinlinecommenteditor';
import { GitHubPage } from '../../_util/githubpage';

describe( 'Features', () => {
	describe( 'NewInlineCommentEditor', () => {
		beforeEach( () => {
			GitHubPage.setPageName( 'repo_pulls' );
		} );

		describe( 'run()', () => {
			it( 'should create an editor', () => {
				const { button, root } = GitHubPage.appendButton( { type: 'pr-inline-comment' } );

				const spy = sinon.spy( NewInlineCommentEditor, 'createEditor' );

				NewInlineCommentEditor.run();
				button.click();

				expect( spy.callCount ).to.equals( 1 );

				const promise = spy.returnValues[ 0 ];

				return promise.then( editor => {
					expect( editor ).to.be.an.instanceOf( NewInlineCommentEditor );
					expect( editor.dom.root ).to.equals( root );
				} );
			} );
		} );
	} );
} );
