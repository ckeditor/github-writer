/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import HeadingDropdown from '../../../src/app/plugins/headingdropdown';

import DropdownView from '@ckeditor/ckeditor5-ui/src/dropdown/dropdownview';
import ToolbarView from '@ckeditor/ckeditor5-ui/src/toolbar/toolbarview';

import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import HeadingButtonsUI from '@ckeditor/ckeditor5-heading/src/headingbuttonsui';
import ParagraphButtonUI from '@ckeditor/ckeditor5-paragraph/src/paragraphbuttonui';

import { createTestEditor } from '../../_util/ckeditor';
import { getData, setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';

import { GitHubPage } from '../../_util/githubpage';

import iconHeading1 from '@ckeditor/ckeditor5-heading/theme/icons/heading1.svg';
import iconHeading2 from '@ckeditor/ckeditor5-heading/theme/icons/heading2.svg';
import iconHeading3 from '@ckeditor/ckeditor5-heading/theme/icons/heading3.svg';
import iconHeading4 from '@ckeditor/ckeditor5-heading/theme/icons/heading4.svg';
import iconHeading5 from '@ckeditor/ckeditor5-heading/theme/icons/heading5.svg';
import iconHeading6 from '@ckeditor/ckeditor5-heading/theme/icons/heading6.svg';
import iconParagraph from '@ckeditor/ckeditor5-core/theme/icons/paragraph.svg';

describe( 'Plugins', () => {
	describe( 'HeadingDropdown', () => {
		let editor, model;

		function createEditor() {
			return createTestEditor( '', [ HeadingDropdown ], {
				heading: {
					options: [
						{ model: 'paragraph', title: 'Paragraph' },
						{ model: 'heading1', view: 'h1', title: 'Heading 1' },
						{ model: 'heading2', view: 'h2', title: 'Heading 2' },
						{ model: 'heading3', view: 'h3', title: 'Heading 3' },
						{ model: 'heading4', view: 'h4', title: 'Heading 4' },
						{ model: 'heading5', view: 'h5', title: 'Heading 5' },
						{ model: 'heading6', view: 'h6', title: 'Heading 6' }
					]
				}
			} );
		}

		{
			beforeEach( 'create test editor', () => {
				return createEditor()
					.then( editorObjects => {
						( { editor, model } = editorObjects );
					} );
			} );

			afterEach( 'cleanup test editor', () => {
				editor.destroy();
			} );
		}

		it( 'should require plugins', () => {
			expect( HeadingDropdown.requires ).to.include.members( [ Heading, Paragraph, HeadingButtonsUI, ParagraphButtonUI ] );
		} );

		it( 'should register the headingDropdown component', () => {
			expect( editor.ui.componentFactory.has( 'headingDropdown' ) ).to.be.true;
			expect( editor.ui.componentFactory.create( 'headingDropdown' ) ).to.be.an.instanceOf( DropdownView );
		} );

		describe( 'dropdown', () => {
			let dropdown;

			beforeEach( () => {
				dropdown = editor.ui.componentFactory.create( 'headingDropdown' );
			} );

			it( 'should have the right position', () => {
				expect( dropdown.panelPosition ).to.equals( 'se' );
			} );

			it( 'should have the right classes', () => {
				expect( dropdown.class ).to.equals( 'tooltipped tooltipped-n' );
			} );

			it( 'should have the right attributes', () => {
				expect( dropdown.template.attributes ).to.have.property( 'aria-label' );
			} );

			it( 'button should have the right label', () => {
				expect( dropdown.buttonView.label ).to.equals( dropdown.template.attributes[ 'aria-label' ][ 0 ] );
			} );

			it( 'button should have the right icon', () => {
				expect( dropdown.buttonView.icon ).to.equals( iconHeading3 );
			} );

			describe( 'execute', () => {
				it( 'should default to heading3', () => {
					setData( model, '<paragraph>Test[]</paragraph>' );
					dropdown.buttonView.fire( 'execute' );
					expect( getData( model ) ).to.equal( '<heading3>Test[]</heading3>' );
				} );

				it( 'should default to heading2 in wiki', () => {
					GitHubPage.setPageName( 'repo_wiki' );

					return createEditor()
						.then( ( { editor, model } ) => {
							const dropdown = editor.ui.componentFactory.create( 'headingDropdown' );

							setData( model, '<paragraph>Test[]</paragraph>' );
							dropdown.buttonView.fire( 'execute' );
							expect( getData( model ) ).to.equal( '<heading2>Test[]</heading2>' );

							return editor.destroy();
						} );
				} );

				it( 'should change heading to paragraph', () => {
					setData( model, '<heading3>Test[]</heading3>' );
					dropdown.buttonView.fire( 'execute' );
					expect( getData( model ) ).to.equal( '<paragraph>Test[]</paragraph>' );
				} );
			} );

			describe( 'state', () => {
				it( 'should bind isEnabled to heading', () => {
					expect( dropdown.isEnabled ).to.be.true;
					editor.commands.get( 'heading' ).forceDisabled();
					expect( dropdown.isEnabled ).to.be.false;
				} );

				it( 'should be off outside heading', () => {
					setData( model, '<paragraph>Test[]</paragraph>' );
					expect( dropdown.buttonView.isOn ).to.be.false;
				} );

				it( 'should be on inside heading', () => {
					setData( model, '<heading3>Test[]</heading3>' );
					expect( dropdown.buttonView.isOn ).to.be.true;
				} );

				it( 'should change icons', () => {
					setData( model, '<paragraph>Test[]</paragraph>' );
					expect( dropdown.buttonView.icon ).to.equals( iconHeading3 );

					setData( model, '<heading2>Test[]</heading2>' );
					expect( dropdown.buttonView.icon ).to.equals( iconHeading2 );
				} );
			} );

			describe( 'toolbar', () => {
				it( 'should be defined as toolbarView', () => {
					expect( dropdown.toolbarView ).to.be.an.instanceOf( ToolbarView );
				} );

				it( 'should have the right toolbar items', () => {
					const icons = [ iconHeading1, iconHeading2, iconHeading3, iconHeading4, iconHeading5, iconHeading6, iconParagraph ];

					expect( dropdown.toolbarView.items.length ).to.equals( icons.length );

					icons.forEach( ( icon, index ) => {
						expect( dropdown.toolbarView.items.get( index ).icon ).to.equals( icon );
					} );
				} );
			} );
		} );
	} );
} );
