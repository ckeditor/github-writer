/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import NewCodeEditor from '../../../src/app/features/newcodeditor';

import editorModes from '../../../src/app/editor/modes';
import CKEditorConfig from '../../../src/app/editor/ckeditorconfig';
import { GitHubPage } from '../../_util/githubpage';

describe( 'Features', () => {
	describe( 'NewCodeEditor', () => {
		beforeEach( () => {
			CKEditorConfig.get.restore();
		} );

		describe( 'run()', () => {
			it( 'should create an editor', () => {
				const root = GitHubPage.appendRoot( { type: 'code' } );

				return NewCodeEditor.run().then( editor => {
					expect( editor ).to.be.an.instanceOf( NewCodeEditor );
					expect( editor.dom.root ).to.equals( root );
				} );
			} );
		} );

		describe( 'overrides', () => {
			let editor;

			beforeEach( () => {
				const filename = GitHubPage.appendElementHtml( '<input type="text" name="filename">' );

				const root = GitHubPage.appendRoot( { type: 'code' } );
				root.append( filename );

				editor = new NewCodeEditor( root );
				return editor.create();
			} );

			it( 'should start in markdown mode', () => {
				expect( editor.getMode() ).to.equals( editorModes.MARKDOWN );
			} );

			it( 'should add mark the root when non markdown file', () => {
				const filename = editor.dom.root.querySelector( 'input[name="filename"]' );
				expect( editor.dom.root.classList.contains( 'github-writer-code-editor-not-md' ) ).to.be.true;

				typeFilename( 'test.md' );
				expect( editor.dom.root.classList.contains( 'github-writer-code-editor-not-md' ) ).to.be.false;

				typeFilename( 'test.js' );
				expect( editor.dom.root.classList.contains( 'github-writer-code-editor-not-md' ) ).to.be.true;

				typeFilename( 'test.markdown' );
				expect( editor.dom.root.classList.contains( 'github-writer-code-editor-not-md' ) ).to.be.false;

				typeFilename( 'test.mdk' );
				expect( editor.dom.root.classList.contains( 'github-writer-code-editor-not-md' ) ).to.be.true;

				function typeFilename( name ) {
					filename.value = name;
					filename.dispatchEvent( new Event( 'input' ) );
				}
			} );
		} );
	} );
} );
