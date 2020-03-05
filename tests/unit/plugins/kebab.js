/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Kebab from '../../../src/app/plugins/kebab';
import DropdownView from '@ckeditor/ckeditor5-ui/src/dropdown/dropdownview';
import ToolbarView from '@ckeditor/ckeditor5-ui/src/toolbar/toolbarview';

import RteEditor from '../../../src/app/editors/rteeditor';

import { createTestEditor } from '../../_util/ckeditor';

import iconKebab from '../../../src/app/icons/kebab.svg';
import iconBold from '@ckeditor/ckeditor5-basic-styles/theme/icons/bold.svg';
import iconItalic from '@ckeditor/ckeditor5-basic-styles/theme/icons/italic.svg';

describe( 'Plugins', () => {
	beforeEach( () => {
		// Mute RteEditor code that is out of the scope of the tests in this file.
		sinon.stub( RteEditor, 'toolbarItemsPostfix' );
	} );

	describe( 'Kebab', () => {
		let editor;

		{
			beforeEach( 'create test editor', () => {
				return createTestEditor( '', [ Kebab ], { kebabToolbar: [ 'bold', 'italic' ] } )
					.then( editorObjects => ( { editor } = editorObjects ) );
			} );

			afterEach( 'cleanup test editor', () => {
				editor.destroy();
			} );
		}

		let dropdown;

		beforeEach( () => {
			dropdown = editor.ui.componentFactory.create( 'kebab' );
		} );

		it( 'should register the kebab component', () => {
			expect( editor.ui.componentFactory.has( 'kebab' ) ).to.be.true;
			expect( editor.ui.componentFactory.create( 'kebab' ) ).to.be.an.instanceOf( DropdownView );
		} );

		it( 'should have the right position', () => {
			expect( dropdown.panelPosition ).to.equals( 'sw' );
		} );

		it( 'should have the right classes', () => {
			expect( dropdown.buttonView.class ).to.equals( 'github-rte-kebab-button tooltipped tooltipped-n' );
		} );

		it( 'should have the right attributes', () => {
			expect( dropdown.buttonView.template.attributes ).to.have.property( 'aria-label' );
		} );

		it( 'button should have the right label', () => {
			expect( dropdown.buttonView.label ).to.equals( dropdown.buttonView.template.attributes[ 'aria-label' ][ 0 ] );
		} );

		it( 'button should have the right icon', () => {
			expect( dropdown.buttonView.icon ).to.equals( iconKebab );
		} );

		it( 'should be defined as toolbarView', () => {
			expect( dropdown.toolbarView ).to.be.an.instanceOf( ToolbarView );
		} );

		it( 'should have the right toolbar items', () => {
			const icons = [ iconBold, iconItalic ];

			expect( dropdown.toolbarView.items.length ).to.equals( icons.length );

			icons.forEach( ( icon, index ) => {
				expect( dropdown.toolbarView.items.get( index ).icon, 'index ' + index ).to.equals( icon );
			} );
		} );

		it( 'should call toolbarItemsPostfix', () => {
			expect( RteEditor.toolbarItemsPostfix.callCount ).to.equals( 1 );
			expect( RteEditor.toolbarItemsPostfix.args[ 0 ] ).to.eql( [ dropdown.toolbarView, 's' ] );
		} );
	} );
} );
