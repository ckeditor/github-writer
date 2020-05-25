/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ModeSwitcher from '../../../src/app/plugins/modeswitcher';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';

import Editor from '../../../src/app/editor/editor';
import CKEditorConfig from '../../../src/app/editor/ckeditorconfig';

import { GitHubPage } from '../../_util/githubpage';

import icon from '../../../src/app/icons/markdown.svg';

describe( 'Plugins', () => {
	describe( 'ModeSwitcher', () => {
		let editor, button;

		{
			beforeEach( 'create test editor', () => {
				CKEditorConfig.get.returns( { plugins: [ Paragraph, ModeSwitcher ] } );

				editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( editor => ( button = editor.ckeditor.ui.componentFactory.create( 'mode' ) ) );
			} );
		}

		it( 'should register the ui component', () => {
			expect( button ).to.be.an.instanceOf( ButtonView );
		} );

		it( 'button should have a label', () => {
			expect( button.label ).to.be.a( 'string' );
		} );

		it( 'button should have the right icon', () => {
			expect( button.icon ).to.equals( icon );
		} );

		it( 'should have the right classes', () => {
			expect( button.class ).to.equals( 'github-writer-mode-button' );
		} );

		it( 'should have tooltip', () => {
			expect( button.tooltip ).to.be.true;
		} );

		it( 'should be a toggleable button', () => {
			expect( button.isToggleable ).to.be.true;
		} );

		it( 'should react to mode changes', () => {
			button.render();

			editor.setMode( Editor.modes.RTE );
			expect( button.isOn ).to.be.false;

			editor.setMode( Editor.modes.MARKDOWN );
			expect( button.isOn ).to.be.true;
			expect( button.element.getAttribute( 'aria-label' ) ).to.be.a( 'string' ).not.equals( button.label + '1' );

			editor.setMode( Editor.modes.RTE );
			expect( button.isOn ).to.be.false;
			expect( button.element.getAttribute( 'aria-label' ) ).to.equals( button.label );
		} );

		it( 'should switch modes on click', () => {
			editor.setMode( Editor.modes.RTE );

			button.fire( 'execute' );
			expect( editor.getMode() ).to.equals( Editor.modes.MARKDOWN );

			button.fire( 'execute' );
			expect( editor.getMode() ).to.equals( Editor.modes.RTE );
		} );

		it( 'should focus on switch to RTE', () => {
			editor.setMode( Editor.modes.MARKDOWN );

			const spy = sinon.spy( editor, 'focus' );

			button.fire( 'execute' );
			expect( spy.callCount ).to.equals( 1 );
		} );
	} );
} );
