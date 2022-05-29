/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import SavedReplyEditor from '../../../src/app/features/savedreplyeditor';
import { GitHubPage } from '../../_util/githubpage';

describe( 'Features', () => {
	describe( 'SavedReplyEditor', () => {
		describe( 'run()', () => {
			it( 'should create an editor on new saved reply', () => {
				const root = GitHubPage.appendRoot( { type: 'saved-reply' } );

				return SavedReplyEditor.run().then( editor => {
					expect( editor ).to.be.an.instanceOf( SavedReplyEditor );
					expect( editor.dom.root ).to.equals( root );
				} );
			} );

			it( 'should create an editor on edit saved reply', () => {
				const root = GitHubPage.appendRoot( { type: 'saved-reply-edit' } );

				return SavedReplyEditor.run().then( editor => {
					expect( editor ).to.be.an.instanceOf( SavedReplyEditor );
					expect( editor.dom.root ).to.equals( root );
				} );
			} );
		} );
	} );
} );
