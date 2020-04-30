/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import CKEditorGitHubEditor from '../../../src/app/editors/ckeditorgithubeditor';
import GFMDataProcessor from '@ckeditor/ckeditor5-markdown-gfm/src/gfmdataprocessor';
import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

describe( 'Editors', () => {
	describe( 'CKEditorGitHubEditor', () => {
		let editor;

		beforeEach( () => {
			return CKEditorGitHubEditor.create( '', {} )
				.then( createdEditor => {
					editor = createdEditor;
				} );
		} );

		afterEach( () => {
			return editor.destroy();
		} );

		it( 'should set the data processor', () => {
			expect( editor.data.processor ).to.be.an.instanceOf( GFMDataProcessor );
		} );

		it( 'should set a toolbar class', () => {
			expect( editor.ui.view.toolbar.element.classList.contains( 'github-writer-toolbar' ) ).to.be.true;
		} );

		it( 'should open the CKEditor inspector on inspect()', () => {
			const stub = sinon.stub( CKEditorInspector, 'attach' );

			editor.inspect();
			expect( stub.callCount ).to.equals( 1 );
		} );
	} );
} );
