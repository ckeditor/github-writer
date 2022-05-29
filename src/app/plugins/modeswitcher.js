/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import EditorExtras from './editorextras';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import editorModes from '../editor/modes';
const { RTE, MARKDOWN } = editorModes;

import icon from '../icons/markdown.svg';

/**
 * Introduces the 'mode' ui button, which can be used to switch between rte/markdown in GitHub Writer.
 */
export default class ModeSwitcher extends Plugin {
	static get requires() {
		return [ EditorExtras ];
	}

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
				class: 'github-writer-mode-button',
				tooltip: true,
				isToggleable: true
			} );

			editor.ready.then( () => {
				const githubEditor = editor.githubEditor;

				// Make changes to the editor mode to be reflected by the button state.
				githubEditor.on( 'mode', () => {
					const mode = githubEditor.getMode();
					const isMarkdown = mode === MARKDOWN;

					view.set( 'isOn', isMarkdown );

					if ( view.element ) {
						// To make it fancy, let's change the tooltip as well.
						view.element.setAttribute( 'aria-label', isMarkdown ?
							'Switch to rich-text editing' :
							view.label );
					}
				} );

				this.listenTo( view, 'execute', () => {
					githubEditor.setMode( githubEditor.getMode() === RTE ? MARKDOWN : RTE );
					githubEditor.focus();
				} );
			} );

			return view;
		} );
	}
}
