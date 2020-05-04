/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import MarkdownEditor from './markdowneditor';

/**
 * The original GiHub markdown editor in the wiki pages.
 */
export default class WikiMarkdownEditor extends MarkdownEditor {
	/**
	 * @inheritDoc
	 */
	// The main difference with the wiki and the markdown editors is the dom.
	getDom( root ) {
		return {
			/**
			 * @inheritDoc
			 * @memberOf WikiMarkdownEditor#dom
			 */
			root,

			/**
			 * Unlike the base class, {MarkdownEditor}, we don't use the toolbar present in the page for wiki pages.
			 * Instead, we use the container that is at the top of the toolbar holding the tabs. This makes the wiki
			 * editor similar to the issues one.
			 *
			 * @type {HTMLElement}
			 * @memberOf WikiMarkdownEditor#dom
			 */
			toolbarContainer: root.querySelector( '.comment-form-head' ),

			/**
			 * @inheritDoc
			 * @memberOf WikiMarkdownEditor#dom
			 */
			textarea: root.querySelector( 'textarea' ),

			/**
			 * @inheritDoc
			 * @memberOf WikiMarkdownEditor#dom
			 */
			panelsContainer: root.querySelector( '.previewable-comment-form' ),

			/**
			 * @inheritDoc
			 * @memberOf WikiMarkdownEditor#dom
			 */
			panels: {

				/**
				 * @inheritDoc
				 * @memberOf WikiMarkdownEditor#dom.panels
				 */
				markdown: root.querySelector( '.previewable-comment-form > .write-content' ),

				/**
				 * @inheritDoc
				 * @memberOf WikiMarkdownEditor#dom.panels
				 */
				preview: root.querySelector( '.previewable-comment-form > .preview-content' )
			}
		};
	}
}
