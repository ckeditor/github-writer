/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Editor from '../editor';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import icon from '../icons/markdown.svg';

/**
 * Introduces the 'mode' ui button, which can be used to switch between rte/markdown in the GitHub RTE.
 */
export default class ModeSwitcher extends Plugin {
	/**
	 * @inheritDoc
	 */
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

			// Wait for the editor to be ready, so this.editor.githubEditor ({Editor}) is available.
			editor.once( 'reallyReady', () => {
				const githubEditor = editor.githubEditor;

				// Make changes to the editor mode to be reflected by the button state.
				githubEditor.on( 'mode', () => {
					const isMarkdown = githubEditor.getMode() === Editor.modes.MARKDOWN;
					view.set( 'isOn', isMarkdown );

					// To make it fancy, let's change the tooltip as well.
					view.element.setAttribute( 'aria-label', isMarkdown ?
						'Switch to rich-text editing' :
						view.label );
				} );

				this.listenTo( view, 'execute', () => {
					githubEditor.setMode( githubEditor.getMode() === Editor.modes.RTE ? Editor.modes.MARKDOWN : Editor.modes.RTE );
				} );
			} );

			return view;
		} );
	}
}
