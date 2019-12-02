/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import MarkdownEditor from './markdowneditor';

export default class WikiMarkdownEditor extends MarkdownEditor {
	getDom( root ) {
		return {
			root,
			toolbarContainer: root.querySelector( '.comment-form-head' ),
			textarea: root.querySelector( 'textarea' ),
			// This is <tab-container> on New Issue and Add Comment and <div> on Edit Comment and Wiki Editor.
			panelsContainer: root.querySelector( '.previewable-comment-form' ),
			panels: {
				markdown: root.querySelector( '.previewable-comment-form > .write-content' ),
				preview: root.querySelector( '.previewable-comment-form > .preview-content' )
			}
		};
	}
}
