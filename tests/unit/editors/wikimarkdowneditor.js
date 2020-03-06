/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../../../src/app/editor';
import MarkdownEditor from '../../../src/app/editors/markdowneditor';
import WikiMarkdownEditor from '../../../src/app/editors/wikimarkdowneditor';

import { PageIncompatibilityError } from '../../../src/app/util';

import { GitHubPage } from '../../_util/githubpage';

describe( 'Editors', () => {
	describe( 'WikiMarkdownEditor', () => {
		beforeEach( () => {
			GitHubPage.setPageName( 'repo_wiki' );
		} );

		it( 'should extend MarkdownEditor', () => {
			const root = GitHubPage.appendRoot( { type: 'wiki' } );
			const editor = new Editor( root );
			const markdownEditor = new WikiMarkdownEditor( editor );

			expect( markdownEditor ).to.be.an.instanceOf( MarkdownEditor );
		} );

		describe( 'constructor()', () => {
			it( 'should save dom references', () => {
				const root = GitHubPage.appendRoot( { type: 'wiki' } );
				const editor = new Editor( root );
				const markdownEditor = new WikiMarkdownEditor( editor );

				expect( markdownEditor ).to.have.property( 'dom' );
				expect( markdownEditor.dom.root ).to.equals( root );
			} );

			it( 'should throw error on invalid dom', () => {
				const root = GitHubPage.appendRoot();
				root.querySelector( '.comment-form-head' ).remove();

				expect( () => new Editor( root ) ).to.throw( PageIncompatibilityError );
			} );
		} );
	} );
} );
