/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import WikiEditor from '../../../src/app/features/wikieditor';
import { GitHubPage } from '../../_util/githubpage';
import CKEditorConfig from '../../../src/app/editor/ckeditorconfig';

describe( 'Features', () => {
	describe( 'WikiEditor', () => {
		beforeEach( () => {
			GitHubPage.setPageName( 'repo_wiki' );
			CKEditorConfig.get.restore();
		} );

		describe( 'run()', () => {
			it( 'should create an editor', () => {
				const root = GitHubPage.appendRoot( { type: 'wiki' } );

				return WikiEditor.run().then( editor => {
					expect( editor ).to.be.an.instanceOf( WikiEditor );
					expect( editor.dom.root ).to.equals( root );
				} );
			} );
		} );

		describe( 'overrides', () => {
			let editor;

			beforeEach( () => {
				const root = GitHubPage.appendRoot( { type: 'wiki' } );
				editor = new WikiEditor( root );
				return editor.create();
			} );

			it( 'should have no placeholder', () => {
				expect( editor.ckeditor.config.get( 'placeholder' ) ).to.be.null;
			} );

			it( 'should have no resizing enabled', () => {
				expect( document.querySelector( '.github-writer-size-container' ) ).to.be.null;
			} );

			it( 'should autolink urls only', () => {
				expect( editor.ckeditor.config.get( 'githubWriter.autoLinking' ) ).to.eql( {
					url: true
				} );
			} );

			describe( 'injectToolbar()', () => {
				it( 'should inject the toolbar in the toolbar container', () => {
					const toolbar = document.createElement( 'div' );

					editor.injectToolbar( toolbar );

					expect( editor.dom.toolbarContainer.lastElementChild ).to.equals( toolbar );
				} );
			} );

			describe( 'createEditableContainer()', () => {
				it( 'should return an element with class github-writer-panel-rte', () => {
					const editable = document.createElement( 'div' );
					const container = editor.createEditableContainer( editable );

					expect( container ).to.be.an.instanceOf( HTMLElement );
					expect( container.classList.contains( 'github-writer-panel-rte' ) ).to.be.true;
				} );

				it( 'should have an element with class github-writer-ckeditor', () => {
					const editable = document.createElement( 'div' );
					const container = editor.createEditableContainer( editable );

					expect( container.querySelector( '.github-writer-ckeditor' ) ).to.be.an.instanceOf( HTMLElement );
				} );

				it( 'should inject the editable inside github-writer-ckeditor', () => {
					const editable = document.createElement( 'div' );
					editor.createEditableContainer( editable );
					expect( editable.parentElement.classList.contains( 'github-writer-ckeditor' ) ).to.be.true;
				} );
			} );
		} );
	} );
} );
