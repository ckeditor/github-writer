/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Autoformat from '../../../src/app/plugins/autoformat';
import CKEditorAutoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat';

import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import StrikethroughEditing from '@ckeditor/ckeditor5-basic-styles/src/strikethrough/strikethroughediting';
import HorizontalLineEditing from '@ckeditor/ckeditor5-horizontal-line/src/horizontallineediting';

import { setData, getData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { createTestEditor } from '../../_util/ckeditor';

describe( 'Plugins', () => {
	describe( 'Autoformat', () => {
		let editor, model;

		{
			beforeEach( 'create test editor', () => {
				return createTestEditor( '', [ Autoformat, HorizontalLineEditing, StrikethroughEditing ] )
					.then( editorObjects => {
						editor = editorObjects.editor;
						model = editorObjects.model;

						// This editor has no DOM, so this method must be stubbed for all tests.
						// Otherwise it will throw as it accesses the DOM to do its job.
						sinon.stub( editor.editing.view, 'scrollToTheSelection' );
					} );
			} );

			afterEach( 'cleanup test editor', () => {
				editor.destroy();
			} );
		}

		it( 'should extend CKEditorAutoformat', () => {
			expect( editor.plugins.get( 'Autoformat' ) ).to.be.an.instanceOf( CKEditorAutoformat );
		} );

		it( 'should do nothing when missing plugins', () => {
			return createTestEditor( '', [ Paragraph, Autoformat ] )
				.then( ( { editor, model } ) => {
					setData( model, '<paragraph>Test ~case[]</paragraph>' );
					model.change( writer => {
						writer.insertText( '~', model.document.selection.getFirstPosition() );
					} );

					expect( getData( model ) ).to.equal( '<paragraph>Test ~case~[]</paragraph>' );

					setData( model, '<paragraph>--[]</paragraph>' );
					model.change( writer => {
						writer.insertText( '-', model.document.selection.getFirstPosition() );
					} );

					expect( getData( model ) ).to.equal( '<paragraph>---[]</paragraph>' );

					return editor.destroy(); // Test cleanup.
				} );
		} );

		describe( 'Strike-through', () => {
			it( 'should replace on ~', () => {
				setData( model, '<paragraph>Test ~case[]</paragraph>' );
				model.change( writer => {
					writer.insertText( '~', model.document.selection.getFirstPosition() );
				} );

				expect( getData( model ) ).to.equal( '<paragraph>Test <$text strikethrough="true">case</$text>[]</paragraph>' );
			} );

			it( 'should not replace on first ~', () => {
				setData( model, '<paragraph>Test []</paragraph>' );
				model.change( writer => {
					writer.insertText( '~', model.document.selection.getFirstPosition() );
				} );

				expect( getData( model ) ).to.equal( '<paragraph>Test ~[]</paragraph>' );
			} );

			it( 'should do nothing if the command is not enabled', () => {
				setData( model, '<paragraph>Test ~case[]</paragraph>' );

				editor.commands.get( 'strikethrough' ).forceDisabled( 'test' );

				model.change( writer => {
					writer.insertText( '~', model.document.selection.getFirstPosition() );
				} );

				expect( getData( model ) ).to.equal( '<paragraph>Test ~case~[]</paragraph>' );
			} );
		} );

		describe( 'Horizontal Line', () => {
			it( 'should replace on third dash', () => {
				setData( model, '<paragraph>--[]</paragraph>' );
				model.change( writer => {
					writer.insertText( '-', model.document.selection.getFirstPosition() );
				} );

				expect( getData( model ) ).to.equal( '<horizontalLine></horizontalLine><paragraph>[]</paragraph>' );
			} );

			it( 'should replace on forth dash', () => {
				setData( model, '<paragraph>---[]</paragraph>' );
				model.change( writer => {
					writer.insertText( '-', model.document.selection.getFirstPosition() );
				} );

				expect( getData( model ) ).to.equal( '<horizontalLine></horizontalLine><paragraph>[]</paragraph>' );
			} );

			it( 'should no replace on second dash', () => {
				setData( model, '<paragraph>-[]</paragraph>' );
				model.change( writer => {
					writer.insertText( '-', model.document.selection.getFirstPosition() );
				} );

				expect( getData( model ) ).to.equal( '<paragraph>--[]</paragraph>' );
			} );
		} );
	} );
} );
