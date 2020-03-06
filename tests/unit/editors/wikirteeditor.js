/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../../../src/app/editor';
import RteEditor from '../../../src/app/editors/rteeditor';
import WikiRteEditor from '../../../src/app/editors/wikirteeditor';

import { GitHubPage } from '../../_util/githubpage';
import { createElementFromHtml } from '../../../src/app/util';

describe( 'Editors', () => {
	describe( 'WikiRteEditor', () => {
		beforeEach( () => {
			GitHubPage.setPageName( 'repo_wiki' );
		} );

		it( 'should extend RteEditor', () => {
			const root = GitHubPage.appendRoot( { type: 'wiki' } );
			const editor = new Editor( root );
			const markdownEditor = new WikiRteEditor( editor );

			expect( markdownEditor ).to.be.an.instanceOf( RteEditor );
		} );

		describe( 'injectToolbar()', () => {
			it( 'should inject the toolbar in the toolbar container', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const rteEditor = new WikiRteEditor( editor );
				const toolbar = document.createElement( 'div' );

				rteEditor.injectToolbar( toolbar );

				expect( editor.markdownEditor.dom.toolbarContainer.lastElementChild ).to.equals( toolbar );
			} );
		} );

		describe( 'getEditableParentTree()', () => {
			it( 'should return a string that converts into an element', () => {
				const rteEditor = new WikiRteEditor( new Editor( GitHubPage.appendRoot() ) );

				const treeHtml = rteEditor.getEditableParentTree();
				expect( treeHtml ).to.be.a( 'string' );

				const tree = createElementFromHtml( treeHtml );
				expect( tree ).to.be.an.instanceOf( HTMLElement );
			} );

			it( 'should have an element with class github-rte-ckeditor', () => {
				const rteEditor = new WikiRteEditor( new Editor( GitHubPage.appendRoot() ) );

				const tree = createElementFromHtml( rteEditor.getEditableParentTree() );
				expect( tree.querySelector( '.github-rte-ckeditor' ) ).to.be.an.instanceOf( HTMLElement );
			} );
		} );
	} );
} );
