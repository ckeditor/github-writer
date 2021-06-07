/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import NewIssueEditor from '../../../src/app/features/newissueeditor';
import { GitHubPage } from '../../_util/githubpage';

describe( 'Features', () => {
	describe( 'NewIssueEditor', () => {
		beforeEach( () => {
			GitHubPage.setPageName( 'repo_issues' );
		} );

		describe( 'run()', () => {
			it( 'should create an editor', () => {
				const root = GitHubPage.appendRoot( { type: 'issue' } );

				return NewIssueEditor.run().then( editor => {
					expect( editor ).to.be.an.instanceOf( NewIssueEditor );
					expect( editor.dom.root ).to.equals( root );
				} );
			} );

			it( 'should not create the editor if the Issue Template feature is enabled (#259)', () => {
				GitHubPage.appendRoot( { type: 'issue' } );
				GitHubPage.appendElementHtml( '<div class="issue-form-body">Issue Template</div>' );

				expect( NewIssueEditor.run() ).to.be.undefined;
			} );
		} );
	} );
} );
