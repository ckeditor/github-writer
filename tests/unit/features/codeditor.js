/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import CodeEditor from '../../../src/app/features/codeditor';
import Editor from '../../../src/app/editor/editor';
import { GitHubPage } from '../../_util/githubpage';
import CKEditorConfig from '../../../src/app/editor/ckeditorconfig';

describe( 'Features', () => {
	describe( 'CodeEditor', () => {
		// Firefox has not support for the CodeEditor for now.
		if ( !window.chrome ) {
			return;
		}

		beforeEach( () => {
			CKEditorConfig.get.restore();
		} );

		describe( 'run()', () => {
			it( 'should create an editor', () => {
				const root = GitHubPage.appendRoot( { type: 'code' } );

				return CodeEditor.run().then( editor => {
					expect( editor ).to.be.an.instanceOf( CodeEditor );
					expect( editor.dom.root ).to.equals( root );
				} );
			} );

			it( 'should resolve to false for non-markdown file', () => {
				const root = GitHubPage.appendRoot( { type: 'code' } );
				root.querySelector( 'textarea' ).setAttribute( 'data-codemirror-mode', 'text/javascript' );

				return CodeEditor.run().then( returnValue => {
					expect( returnValue ).to.be.false;
				} );
			} );
		} );

		describe( 'overrides', () => {
			let editor;

			beforeEach( () => {
				const root = GitHubPage.appendRoot( { type: 'code' } );
				editor = new CodeEditor( root );
				return editor.create();
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

			describe( 'injectEditable()', () => {
				it( 'should inject editable container after the markdown panel', () => {
					expect( editor.dom.root.querySelector( '.github-writer-panel-rte' ).previousElementSibling )
						.to.equals( editor.dom.panels.markdown );
				} );
			} );
		} );

		it( 'should update codemirror when switching to markdown', done => {
			const div = GitHubPage.appendElementHtml( '<div class="CodeMirror"></div>' );
			div.CodeMirror = { setValue: sinon.stub() };

			const root = GitHubPage.appendRoot( { type: 'code' } );
			root.append( div );

			const editor = new CodeEditor( root );

			editor.create().then( () => {
				editor.setMode( Editor.modes.RTE );
				editor.setData( 'Test' );

				div.CodeMirror.setValue.reset();

				editor.setMode( Editor.modes.MARKDOWN );

				setTimeout( () => {
					expect( div.CodeMirror.setValue.callCount ).to.equals( 1 );
					expect( div.CodeMirror.setValue.calledWith( 'Test' ) ).to.be.true;
					done();
				} );
			} );
		} );
	} );
} );
