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
				label: 'Edit markdown (nostalgia)',
				icon,
				class: 'github-rte-mode-button',
				tooltip: true,
				isToggleable: true
			} );

			// Wait for the editor to be ready, so this.editor.githubEditor is available.
			editor.once( 'reallyReady', () => {
				const githubEditor = editor.githubEditor;

				// Make changes to the editor mode to be reflected by the button state.
				githubEditor.on( 'mode', () => {
					const isMarkdown = githubEditor.mode === Editor.modes.MARKDOWN;
					view.set( 'isOn', isMarkdown );
					view.set( 'label', isMarkdown ?
						'Switch to rich-text editing' :
						'Edit markdown (nostalgia)' );
				} );

				this.listenTo( view, 'execute', () => {
					githubEditor.mode = githubEditor.mode === Editor.modes.RTE ? Editor.modes.MARKDOWN : Editor.modes.RTE;
				} );
			} );

			return view;
		} );
	}
}
