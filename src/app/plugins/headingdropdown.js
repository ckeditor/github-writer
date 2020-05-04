/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import SplitButtonView from '@ckeditor/ckeditor5-ui/src/dropdown/button/splitbuttonview';
import HeadingButtonsUI from '@ckeditor/ckeditor5-heading/src/headingbuttonsui';
import ParagraphButtonUI from '@ckeditor/ckeditor5-paragraph/src/paragraphbuttonui';

import { addToolbarToDropdown, createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import normalizeToolbarConfig from '@ckeditor/ckeditor5-ui/src/toolbar/normalizetoolbarconfig';

import App from '../app';

import iconHeading1 from '@ckeditor/ckeditor5-heading/theme/icons/heading1.svg';
import iconHeading2 from '@ckeditor/ckeditor5-heading/theme/icons/heading2.svg';
import iconHeading3 from '@ckeditor/ckeditor5-heading/theme/icons/heading3.svg';
import iconHeading4 from '@ckeditor/ckeditor5-heading/theme/icons/heading4.svg';
import iconHeading5 from '@ckeditor/ckeditor5-heading/theme/icons/heading5.svg';
import iconHeading6 from '@ckeditor/ckeditor5-heading/theme/icons/heading6.svg';

const icons = {
	heading1: iconHeading1,
	heading2: iconHeading2,
	heading3: iconHeading3,
	heading4: iconHeading4,
	heading5: iconHeading5,
	heading6: iconHeading6
};

export default class HeadingDropdown extends Plugin {
	static get requires() {
		return [ Heading, Paragraph, HeadingButtonsUI, ParagraphButtonUI ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		const defaultHeading = App.pageManager.type === 'wiki' ? 'heading2' : 'heading3';

		editor.ui.componentFactory.add( 'headingDropdown', locale => {
			const dropdown = createDropdown( locale, SplitButtonView );

			dropdown.panelPosition = 'se';

			dropdown.set( {
				// The tooltipped tooltipped-n (north) classes enable the GH tooltip.
				class: 'tooltipped tooltipped-n'
			} );

			dropdown.extendTemplate( {
				attributes: {
					// The GH tooltip text is taken from aria-label.
					'aria-label': 'Add header text'
				}
			} );

			dropdown.buttonView.set( {
				label: 'Add header text',
				icon: icons.heading3
			} );

			dropdown.buttonView.on( 'execute', () => {
				if ( editor.commands.get( 'heading' ).value ) {
					editor.execute( 'paragraph' );
				} else {
					editor.execute( 'heading', { value: defaultHeading } );
				}
			} );

			// Control the button state.
			{
				const headingCommand = editor.commands.get( 'heading' );
				dropdown.bind( 'isEnabled' ).to( headingCommand );
				dropdown.buttonView.bind( 'isOn' ).to( headingCommand, 'value', value => !!value );
				dropdown.buttonView.bind( 'icon' ).to( headingCommand, 'value', value => value ? icons[ value ] : icons[ defaultHeading ] );
			}

			// Initializes the 'toolbarView' property of the dropdown.
			addToolbarToDropdown( dropdown, [] );

			// Fill the toolbar with the configured items.
			const toolbarConfig = normalizeToolbarConfig( [
				'heading1',
				'heading2',
				'heading3',
				'heading4',
				'heading5',
				'heading6',
				'paragraph'
			] );
			dropdown.toolbarView.fillFromConfig( toolbarConfig.items, editor.ui.componentFactory );

			return dropdown;
		} );
	}
}
