/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import GitHubEditor from '../ckeditor/githubeditor';

export default class Editor {
	/**
	 * A GitHub RTE editor, created as a replacement for the default markdown editor.
	 *
	 * @param markdownEditorRoot {HTMLElement} The element that contains the complete DOM of a single GitHub markdown
	 * editor.
	 */
	constructor( markdownEditorRootElement ) {
		this.rootElement = markdownEditorRootElement;
		this.setMode( 'markdown' );
	}

	create() {
		const toolbar = this.rootElement.querySelector( 'markdown-toolbar' );
		const textarea = this.rootElement.querySelector( '#' + toolbar.getAttribute( 'for' ) );
		const focusBox = this.rootElement.querySelector( 'div.upload-enabled' );

		// toolbar.style.background = 'red';
		// textarea.style.background = 'blue';

		const data = textarea.textContent;

		GitHubEditor.create( data )
			.then( editor => {
				const outer = document.createElement( 'div' );
				outer.classList.add( 'github-rte-ckeditor', 'form-control', 'input-contrast', 'comment-form-textarea' );
				outer.append( editor.ui.getEditableElement() );

				editor.ui.focusTracker.on( 'change:isFocused', ( evt, name, value ) => {
					focusBox.classList.toggle( 'focused', !!value );
				} );

				this.editor = editor;
				textarea.insertAdjacentElement( 'afterend', outer );

				this.setMode( 'rte' );
			} );
	}

	setMode( mode ) {
		this.rootElement.classList.toggle( 'github-rte-mode-rte', mode == 'rte' );
		this.rootElement.classList.toggle( 'github-rte-mode-markdown', mode == 'markdown' );
	}
}
