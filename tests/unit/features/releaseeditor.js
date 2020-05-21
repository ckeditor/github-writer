/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ReleaseEditor from '../../../src/app/features/releaseeditor';
import { GitHubPage } from '../../_util/githubpage';

describe( 'Features', () => {
	describe( 'ReleaseEditor', () => {
		beforeEach( () => {
			GitHubPage.setPageName( 'repo_releases' );
		} );

		describe( 'run()', () => {
			it( 'should create an editor', () => {
				const root = GitHubPage.appendRoot( { type: 'release' } );

				return ReleaseEditor.run().then( editor => {
					expect( editor ).to.be.an.instanceOf( ReleaseEditor );
					expect( editor.dom.root ).to.equals( root );
				} );
			} );
		} );
		describe( 'overrides', () => {
			let editor;

			beforeEach( () => {
				const root = GitHubPage.appendRoot( { type: 'release' } );
				editor = new ReleaseEditor( root );
				return editor.create();
			} );

			describe( 'injectToolbar()', () => {
				it( 'should inject the toolbar after the tabs', () => {
					const toolbar = document.createElement( 'div' );

					editor.injectToolbar( toolbar );

					expect( editor.dom.root.querySelector( 'nav.tabnav-tabs' ).nextElementSibling ).to.equals( toolbar );
				} );

				it( 'should do nothing if no tabs', () => {
					editor.dom.root.querySelector( 'nav.tabnav-tabs' ).remove();

					const toolbar = document.createElement( 'div' );
					toolbar.classList.add( 'test-toolbar' );

					editor.injectToolbar( toolbar );

					expect( document.querySelector( '.test-toolbar' ) ).to.be.null;
				} );
			} );

			describe( 'injectEditable()', () => {
				it( 'should inject the editable after the preview panel', () => {
					const editable = document.createElement( 'div' );
					editable.classList.add( 'test-editable' );

					editor.injectEditable( editable );

					expect( editor.dom.panels.preview.nextElementSibling.querySelector( '.test-editable' ) ).to.equals( editable );
				} );
			} );
		} );
	} );
} );
