/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ControlClick from '../../../src/app/plugins/controlclick';
import KeyStyler from '../../../src/app/plugins/keystyler';
import EditorExtras from '../../../src/app/plugins/editorextras';
import LinkEditing from '@ckeditor/ckeditor5-link/src/linkediting';
import AutoLinkUrl from '../../../src/app/plugins/autolinkurl';

import { createTestEditor } from '../../_util/ckeditor';

describe( 'Plugins', () => {
	describe( 'ControlClick', () => {
		let editor;

		{
			beforeEach( 'create test editor', done => {
				createTestEditor( '', [ ControlClick, EditorExtras, LinkEditing, AutoLinkUrl ], {
					githubWriter: { autoLinking: { url: true } }
				} )
					.then( editorObjects => ( { editor } = editorObjects ) )
					.then( () => editor.ready.then( () => done() ) );
			} );

			afterEach( 'cleanup test editor', () => {
				editor.destroy();
			} );
		}

		it( 'should require plugins', () => {
			expect( ControlClick.requires ).to.include( KeyStyler );
		} );

		it( 'should add class to editable on ctrl', () => {
			const editable = editor.ui.getEditableElement();
			expect( editable.classList.contains( 'github-writer-key-ctrl' ) ).to.be.false;

			document.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Control' } ) );
			expect( editable.classList.contains( 'github-writer-key-ctrl' ) ).to.be.true;

			document.dispatchEvent( new KeyboardEvent( 'keyup', { key: 'Control' } ) );
			expect( editable.classList.contains( 'github-writer-key-ctrl' ) ).to.be.false;
		} );

		it( 'should add class to editable on meta', () => {
			const editable = editor.ui.getEditableElement();
			expect( editable.classList.contains( 'github-writer-key-ctrl' ) ).to.be.false;

			document.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Meta' } ) );
			expect( editable.classList.contains( 'github-writer-key-ctrl' ) ).to.be.true;

			document.dispatchEvent( new KeyboardEvent( 'keyup', { key: 'Meta' } ) );
			expect( editable.classList.contains( 'github-writer-key-ctrl' ) ).to.be.false;
		} );

		it( 'should open link on ctrl+click', () => {
			editor.setData( 'Test [link](https://test.com)' );

			const editable = editor.ui.getEditableElement();
			const link = editable.querySelector( 'a' );

			const stub = sinon.stub( window, 'open' );

			document.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Control' } ) );
			link.dispatchEvent( new MouseEvent( 'mousedown', { bubbles: true, cancelable: true } ) );
			document.dispatchEvent( new KeyboardEvent( 'keyup', { key: 'Control' } ) );

			expect( stub.callCount ).to.equals( 1 );
		} );

		it( 'should open autolink on ctrl+click', () => {
			editor.setData( 'Test https://test.com' );

			const editable = editor.ui.getEditableElement();
			const link = editable.querySelector( 'autolink' );

			const stub = sinon.stub( window, 'open' );

			document.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Control' } ) );
			link.dispatchEvent( new MouseEvent( 'mousedown', { bubbles: true, cancelable: true } ) );
			document.dispatchEvent( new KeyboardEvent( 'keyup', { key: 'Control' } ) );

			expect( stub.callCount ).to.equals( 1 );
		} );

		it( 'should do nothing on link plain click', () => {
			editor.setData( 'Test [link](https://test.com)' );

			const editable = editor.ui.getEditableElement();
			const link = editable.querySelector( 'a' );

			const stub = sinon.stub( window, 'open' );

			link.dispatchEvent( new MouseEvent( 'mousedown', { bubbles: true, cancelable: true } ) );

			expect( stub.callCount ).to.equals( 0 );
		} );

		it( 'should do nothing on non clicable ctrl+click', () => {
			editor.setData( 'Test **bold**' );

			const editable = editor.ui.getEditableElement();
			const strong = editable.querySelector( 'strong' );

			const stub = sinon.stub( window, 'open' );

			document.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Control' } ) );
			strong.dispatchEvent( new MouseEvent( 'mousedown', { bubbles: true, cancelable: true } ) );
			document.dispatchEvent( new KeyboardEvent( 'keyup', { key: 'Control' } ) );

			expect( stub.callCount ).to.equals( 0 );
		} );
	} );
} );
