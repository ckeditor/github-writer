/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import KeyStyler, { KeyStylerManager } from '../../../src/app/plugins/keystyler';
import EditorExtras from '../../../src/app/plugins/editorextras';

import { createTestEditor } from '../../_util/ckeditor';

describe( 'Plugins', () => {
	describe( 'KeyStyler', () => {
		let editor;

		{
			beforeEach( 'create test editor', done => {
				createTestEditor( '', [ KeyStyler, EditorExtras ] )
					.then( editorObjects => ( { editor } = editorObjects ) )
					.then( () => editor.ready.then( () => done() ) );
			} );

			afterEach( 'cleanup test editor', () => {
				editor.destroy();
			} );
		}

		it( 'should require plugins', () => {
			expect( KeyStyler.requires ).to.include( EditorExtras );
		} );

		it( 'should define editor.keyStyler', () => {
			expect( editor.keyStyler ).to.be.an.instanceOf( KeyStylerManager );
		} );

		it( 'should add class on key down and remove on key up', () => {
			const editable = editor.ui.getEditableElement();

			editor.keyStyler.add( 'Control', 'test-control' );

			document.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Control' } ) );
			expect( editable.classList.contains( 'test-control' ) ).to.be.true;

			document.dispatchEvent( new KeyboardEvent( 'keyup', { key: 'Control' } ) );
			expect( editable.classList.contains( 'test-control' ) ).to.be.false;
		} );

		it( 'should check if a class is active', () => {
			editor.keyStyler.add( 'Control', 'test-control' );
			expect( editor.keyStyler.isActive( 'Control' ) ).to.be.false;

			document.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Control' } ) );
			expect( editor.keyStyler.isActive( 'Control' ) ).to.be.true;

			document.dispatchEvent( new KeyboardEvent( 'keyup', { key: 'Control' } ) );
			expect( editor.keyStyler.isActive( 'Control' ) ).to.be.false;
		} );
	} );
} );
