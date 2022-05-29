/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import NewCommentEditor from '../../../src/app/features/newcommenteditor';
import { GitHubPage } from '../../_util/githubpage';

describe( 'Features', () => {
	describe( 'NewCommentEditor', () => {
		beforeEach( () => {
			GitHubPage.setPageName( 'repo_issues' );
		} );

		describe( 'run()', () => {
			it( 'should create an editor', () => {
				const root = GitHubPage.appendRoot( { type: 'comment' } );

				return NewCommentEditor.run().then( editor => {
					expect( editor ).to.be.an.instanceOf( NewCommentEditor );
					expect( editor.dom.root ).to.equals( root );
				} );
			} );
		} );
	} );
} );
