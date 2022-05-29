/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import EditorExtras from '../../../src/app/plugins/editorextras';

import { setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { createTestEditor } from '../../_util/ckeditor';

describe( 'Plugins', () => {
	describe( 'EditorExtras', () => {
		let editor, model;

		{
			beforeEach( 'create test editor', () => {
				return createTestEditor( '', [ EditorExtras ] )
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

		describe( 'editor.isEmpty', () => {
			it( 'should be true on load of empty-like data', () => {
				setData( model, '<paragraph>[]</paragraph>' );
				expect( editor.isEmpty ).to.equals( true );
			} );

			it( 'should be false on load of non empty data', () => {
				setData( model, '<paragraph>Test[]</paragraph>' );
				expect( editor.isEmpty ).to.equals( false );
			} );

			it( 'should reflect update on data changes', () => {
				setData( model, '<paragraph>[]</paragraph>' );
				expect( editor.isEmpty ).to.equals( true );

				model.change( writer => {
					writer.insertText( 'A', model.document.selection.getFirstPosition() );
				} );
				expect( editor.isEmpty ).to.equals( false );
			} );

			it( 'should be observable', done => {
				setData( model, '<paragraph>[]</paragraph>' );

				editor.on( 'change:isEmpty', ( evt, propertyName, newValue, oldValue ) => {
					expect( newValue ).to.equals( false );
					expect( oldValue ).to.equals( true );
					done();
				} );

				setData( model, '<paragraph>Test</paragraph>' );
			} );
		} );

		describe( 'editor.focus()', () => {
			it( 'should focus the editing view', () => {
				const spy = sinon.spy( editor.editing.view, 'focus' );

				editor.focus();

				expect( spy.callCount ).to.equals( 1 );
			} );
		} );

		describe( 'editor.ready', () => {
			it( 'should be a promise', () => {
				expect( editor.ready ).to.be.an.instanceOf( Promise );
			} );

			it( 'should resolve on "reallyReady"', () => {
				const promise = editor.ready;

				editor.fire( 'reallyReady' );

				return promise;
			} );

			it( 'should resolve after "reallyReady"', () => {
				editor.fire( 'reallyReady' );

				return editor.ready.then( () => editor.ready );
			} );

			it( 'should resolve with the editor', () => {
				editor.fire( 'reallyReady' );

				return editor.ready.then( ret => {
					expect( ret ).to.equals( editor );
				} );
			} );
		} );
	} );
} );
