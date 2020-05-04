/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import CKEditorGitHubEditor from '../../../src/app/editors/ckeditorgithubeditor';
import GFMDataProcessor from '@ckeditor/ckeditor5-markdown-gfm/src/gfmdataprocessor';
import CKEditorInspector from '@ckeditor/ckeditor5-inspector';
import BoldEditing from '@ckeditor/ckeditor5-basic-styles/src/bold/boldediting';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import ItalicEditing from '@ckeditor/ckeditor5-basic-styles/src/italic/italicediting';
import StrikethroughEditing from '@ckeditor/ckeditor5-basic-styles/src/strikethrough/strikethroughediting';
import CodeEditing from '@ckeditor/ckeditor5-basic-styles/src/code/codeediting';
import { setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';

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

		it( 'should fix the priority of the code element', () => {
			return CKEditorGitHubEditor.create( '',
				{ plugins: [ Paragraph, BoldEditing, ItalicEditing, StrikethroughEditing, CodeEditing ] } )
				.then( editor => {
					setData( editor.model, '<paragraph>Test <$text bold="true" code="true">text</$text></paragraph>' );
					expect( editor.getData() ).to.equals( 'Test **`text`**' );

					setData( editor.model, '<paragraph>Test <$text italic="true" code="true">text</$text></paragraph>' );
					expect( editor.getData() ).to.equals( 'Test _`text`_' );

					setData( editor.model, '<paragraph>Test <$text strikethrough="true" code="true">text</$text></paragraph>' );
					expect( editor.getData() ).to.equals( 'Test ~`text`~' );

					return editor.destroy();
				} );
		} );
	} );
} );
