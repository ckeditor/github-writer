/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */
import { checkDom } from '../util';

export default class MarkdownEditor {
	constructor( githubEditor ) {
		const root = githubEditor.dom.root;
		const toolbar = root.querySelector( 'markdown-toolbar' );

		this.dom = {
			root,
			toolbar,
			textarea: toolbar && root.querySelector( '#' + toolbar.getAttribute( 'for' ) ),
			// This is <tab-container> on New Issue and Add Comment and <div> on Edit Comment.
			panelsContainer: root.querySelector( '.previewable-comment-form' ),
			panels: {
				markdown: root.querySelector( '.previewable-comment-form > file-attachment' ),
				preview:
				// This one is used on New Issue and Add Comment.
					root.querySelector( '.previewable-comment-form > .js-preview-panel' ) ||
					// This one is used on Edit Comment.
					root.querySelector( '.previewable-comment-form > .preview-content' )
			}
		};

		checkDom( this.dom );

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
