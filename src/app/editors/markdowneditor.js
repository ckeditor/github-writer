/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export default class MarkdownEditor {
	constructor( markdownEditorRootElement ) {
		const toolbar = markdownEditorRootElement.querySelector( 'markdown-toolbar' );

		this.dom = {
			root: markdownEditorRootElement,
			toolbar,
			textarea: markdownEditorRootElement.querySelector( '#' + toolbar.getAttribute( 'for' ) )
		};
	}

	getData() {
		return this.dom.textarea.value;
	}

	setData( data, reset ) {
		this.dom.textarea.value = data;

		if ( reset ) {
			this.dom.textarea.defaultValue = data;
		}

		// This will fix the textarea height.
		this.dom.textarea.dispatchEvent( new Event( 'change' ) );
	}
}
