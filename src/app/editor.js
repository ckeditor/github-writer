/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export default class Editor {
	/**
	 * A GitHub RTE editor, created as a replacement for the default markdown editor.
	 *
	 * @param markdownEditorRoot {HTMLElement} The element that contains the complete DOM of a single GitHub markdown
	 * editor.
	 */
	constructor( markdownEditorRootElement ) {
		this.rootElement = markdownEditorRootElement;
	}

	create() {
		const toolbar = this.rootElement.querySelector( 'markdown-toolbar' );
		const textarea = this.rootElement.querySelector( '#' + toolbar.getAttribute( 'for' ) );

		toolbar.style.background = 'red';
		textarea.style.background = 'blue';
	}
}
