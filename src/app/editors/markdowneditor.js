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
			textarea: markdownEditorRootElement.querySelector( '#' + toolbar.getAttribute( 'for' ) ),
			// This is <tab-container> on New Issue and Add Comment and <div> on Edit Comment.
			panelsContainer: markdownEditorRootElement.querySelector( '.previewable-comment-form' ),
			panels: {
				markdown: markdownEditorRootElement.querySelector( '.previewable-comment-form > file-attachment' ),
				preview:
				// This one is used on New Issue and Add Comment.
					markdownEditorRootElement.querySelector( '.previewable-comment-form > .js-preview-panel' ) ||
					// This one is used on Edit Comment.
					markdownEditorRootElement.querySelector( '.previewable-comment-form > .preview-content' )
			}
		};

		this.dom.panels.markdown.classList.add( 'github-rte-panel-markdown' );
		this.dom.panels.preview.classList.add( 'github-rte-panel-preview' );

		this.isEdit = this.dom.panelsContainer.nodeName === 'DIV';
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
