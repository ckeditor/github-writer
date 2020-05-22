/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import NewPullRequestEditor from '../../../src/app/features/newpullrequesteditor';
import { GitHubPage } from '../../_util/githubpage';

describe( 'Features', () => {
	describe( 'NewPullRequestEditor', () => {
		beforeEach( () => {
			GitHubPage.setPageName( 'repo_pulls' );
		} );

		describe( 'run()', () => {
			it( 'should create an editor', () => {
				const root = GitHubPage.appendRoot( { type: 'pull-request' } );

				return NewPullRequestEditor.run().then( editor => {
					expect( editor ).to.be.an.instanceOf( NewPullRequestEditor );
					expect( editor.dom.root ).to.equals( root );
				} );
			} );
		} );
	} );
} );
