/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import icon from '../icons/markdown.svg';
import Editor from '../editor';

export default class ModeSwitcher extends Plugin {
	init() {
		const editor = this.editor;

		editor.ui.componentFactory.add( 'mode', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: editor.t( 'Edit markdown (nostalgia)' ),
				icon,
				class: 'github-rte-mode-button',
				tooltip: true,
				isToggleable: true
			} );

			// Bind the button state to both the 'code' and 'codeBlock' commands state.
			// {
			// 	const headingCommand = editor.commands.get( 'heading' );
			// 	view.bind( 'isOn', 'isEnabled' ).to( headingCommand, 'value', 'isEnabled' );
			// }

			this.listenTo( view, 'execute', () => {
				const githubEditor = this.editor.githubEditor;

				githubEditor.mode = githubEditor.mode === Editor.modes.RTE ? Editor.modes.MARKDOWN : Editor.modes.RTE;
			} );

			return view;
		} );
	}
}
