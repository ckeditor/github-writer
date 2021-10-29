/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import MilestoneEditor from '../../../src/app/features/milestoneeditor';
import { GitHubPage } from '../../_util/githubpage';
import CKEditorConfig from '../../../src/app/editor/ckeditorconfig';

describe( 'Features', () => {
	describe( 'MilestoneEditor', () => {
		beforeEach( () => {
			GitHubPage.setPageName( 'repo_issues' );
			CKEditorConfig.get.restore();
		} );

		describe( 'run()', () => {
			it( 'should create an editor', () => {
				const root = GitHubPage.appendRoot( { type: 'milestone' } );

				return MilestoneEditor.run().then( editor => {
					expect( editor ).to.be.an.instanceOf( MilestoneEditor );
					expect( editor.dom.root ).to.equals( root );
				} );
			} );

			it( 'should create an editor (edit)', () => {
				const root = GitHubPage.appendRoot( { type: 'milestone-edit' } );

				return MilestoneEditor.run().then( editor => {
					expect( editor ).to.be.an.instanceOf( MilestoneEditor );
					expect( editor.dom.root ).to.equals( root );
				} );
			} );
		} );

		describe( 'overrides', () => {
			let editor;

			beforeEach( () => {
				const root = GitHubPage.appendRoot( { type: 'milestone' } );
				editor = new MilestoneEditor( root );
				return editor.create();
			} );

			it( 'should have no resizing enabled', () => {
				expect( document.querySelector( '.github-writer-size-container' ) ).to.be.null;
			} );

			it( 'should autolink urls only', () => {
				expect( editor.ckeditor.config.get( 'githubWriter.autoLinking' ) ).to.eql( {
					url: true
				} );
			} );

			it( 'should defined the plugins configuration', () => {
				expect( editor.ckeditor.config.get( 'plugins' ) ).to.be.an( 'array' );
			} );

			it( 'should have just the mode switcher in the kebab', () => {
				expect( editor.ckeditor.config.get( 'kebabToolbar' ) ).to.eql( [ 'mode' ] );
			} );

			it( 'should inject the toolbar at the beginning of the textarea block', () => {
				const toolbar = document.createElement( 'div' );

				editor.injectToolbar( toolbar );

				const toolbarContainer = document.querySelector( '.write-content' ).firstElementChild;

				expect( toolbarContainer.classList.contains( 'github-writer-toolbar-container' ) ).to.be.true;
				expect( toolbarContainer.firstElementChild ).to.equals( toolbar );
			} );

			it( 'should inject the editable at the end of the textarea block', () => {
				const editable = document.createElement( 'div' );
				editable.classList.add( 'test-editable' );

				editor.injectEditable( editable );

				const container = document.querySelector( '.write-content' ).lastElementChild;

				expect( container.classList.contains( 'github-writer-panel-rte' ) ).to.be.true;
				expect( container.querySelector( '.test-editable' ) ).to.equals( editable );
			} );
		} );
	} );
} );

