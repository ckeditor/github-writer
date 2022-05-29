/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ReviewEditor from '../../../src/app/features/revieweditor';
import { GitHubPage } from '../../_util/githubpage';

describe( 'Features', () => {
	describe( 'ReviewEditor', () => {
		beforeEach( () => {
			GitHubPage.setPageName( 'repo_pulls' );
		} );

		describe( 'run()', () => {
			it( 'should create an editor', () => {
				const root = GitHubPage.appendRoot( { type: 'pull-request-review' } );

				return ReviewEditor.run().then( editor => {
					expect( editor ).to.be.an.instanceOf( ReviewEditor );
					expect( editor.dom.root ).to.equals( root );
				} );
			} );
		} );
	} );
} );
