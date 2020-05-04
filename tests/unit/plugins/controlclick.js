/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ControlClick from '../../../src/app/plugins/controlclick';
import KeyStyler from '../../../src/app/plugins/keystyler';
import EditorExtras from '../../../src/app/plugins/editorextras';
import LinkEditing from '@ckeditor/ckeditor5-link/src/linkediting';
import AutoLinking from '../../../src/app/plugins/autolinking';

import { createTestEditor } from '../../_util/ckeditor';
import { getData as getViewData } from '@ckeditor/ckeditor5-engine/src/dev-utils/view';
import { setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';

describe( 'Plugins', () => {
	describe( 'ControlClick', () => {
		let editor;

		{
			beforeEach( 'create test editor', done => {
				createTestEditor( '', [ ControlClick, EditorExtras, LinkEditing, AutoLinking ], {
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

		it( 'should add attribute to links', () => {
			setData( editor.model,
				'<paragraph>Test <$text linkHref="https://test.com">li[]nk</$text></paragraph>' );

			expect( getViewData( editor.editing.view ) ).to.equals(
				'<p>' +
				'Test <a class="ck-link_selected" data-control-click="href" href="https://test.com">li{}nk</a>' +
				'</p>' );
		} );

		it( 'should add attribute to autolink', () => {
			setData( editor.model,
				'<paragraph>Test https://tes[]t.com</paragraph>' );

			expect( getViewData( editor.editing.view ) ).to.equals(
				'<p>' +
				'Test ' +
				'<autolink' +
				' data-control-click="data-url"' +
				' data-enabled="true"' +
				' data-text="https://test.com"' +
				' data-type="url"' +
				' data-url="https://test.com"' +
				' spellcheck="false">' +
				'https://tes{}t.com' +
				'</autolink>' +
				'</p>' );
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
