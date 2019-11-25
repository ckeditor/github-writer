/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import icon from '../icons/heading.svg';

export default class HeadingSwitch extends Plugin {
	static get requires() {
		return [ Heading, Paragraph ];
	}

	afterInit() {
		const editor = this.editor;

		editor.ui.componentFactory.add( 'headingSwitch', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: editor.t( 'Add header text' ),
				icon,
				tooltip: true,
				isToggleable: true
			} );

			// Bind the button state to both the 'code' and 'codeBlock' commands state.
			{
				const headingCommand = editor.commands.get( 'heading' );
				view.bind( 'isOn', 'isEnabled' ).to( headingCommand, 'value', 'isEnabled' );
			}

			// The button will smartly decide which code command to execute, based on the user selection.
			this.listenTo( view, 'execute', () => {
				if ( editor.commands.get( 'heading' ).value ) {
					editor.execute( 'paragraph' );
				} else {
					editor.execute( 'heading', { value: 'heading3' } );
				}
			} );

			return view;
		} );
	}
}
