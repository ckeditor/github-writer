/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../editor';
import App from '../app';

import { checkDom } from '../util';

/**
 * The original GitHub markdown editor.
 */
export default class MarkdownEditor {
	/**
	 * Creates a markdown editor.
	 *
	 * The first job of this constructor is checking if the page dom is still compatible with the application.
	 * If not, an error is thrown and no editor is created, leaving the user with the original markdown editor
	 * untouched (safe fallback).
	 *
	 * @param {Editor} githubEditor The parent editor that uses this editor when in markdown mode.
	 */
	constructor( githubEditor ) {
		/**
		 * The GitHub dom elements that are required for this class to operate.
		 *
		 * A check is made against these elements. If any element is missing, an error is thrown and the creation of
		 * the editor is aborted without consequences to the end user, who can still use the original markdown editor.
		 *
		 * @type {Object}
		 */
		this.dom = this.getDom( githubEditor.dom.root );

		// Before touching the page, we check the dom.
		checkDom( this.dom );

		githubEditor.domManipulator.addRollbackOperation( () => delete this.dom );

		/**
		 * Tells if the dom around the editor is like the one used to edit comments, which is different from
		 * the one used in the main editor available in the page (GH inconsistency).
		 *
		 * It should be true when editing comments and wiki pages.
		 *
		 * @type {boolean} `true` if this editor dom  like the one in comment edit.
		 */
		this.isEdit = this.dom.panelsContainer.nodeName === 'DIV';

		// Inject our classes in the dom. These will help controlling the editor through CSS.
		githubEditor.domManipulator.addClass( this.dom.panels.markdown, 'github-rte-panel-markdown' );
		githubEditor.domManipulator.addClass( this.dom.panels.preview, 'github-rte-panel-preview' );

		// Perform some mode change tweaks.
		githubEditor.on( 'mode', () => {
			if ( githubEditor.getMode() === Editor.modes.MARKDOWN ) {
				// This will fix the textarea height to adjust to it's size (GH logic).
				this.dom.textarea.dispatchEvent( new Event( 'change' ) );
			}
		} );
	}

	/**
	 * Gets all dom elements that are required for the logic of this class.
	 *
	 * @param {HTMLElement} root The outermost element enclosing the structure of the original markdown editor.
	 * @returns {Object} The object which is assigned to {MarkdownEditor#dom} by its constructor.
	 */
	getDom( root ) {
		let toolbar = root.querySelector( 'markdown-toolbar' );

		// The release page doesn't have a toolbar, so we inject an empty one for our code to move on.
		if ( !toolbar && App.pageManager.page === 'repo_releases' ) {
			const tabs = root.querySelector( 'nav.tabnav-tabs' );

			if ( tabs ) {
				toolbar = document.createElement( 'markdown-toolbar' );
				tabs.after( toolbar );
			}
		}

		return {
			/**
			 * The outermost element encompassing the structure around the original GitHub markdown editor.
			 *
			 * @type {HTMLElement}
			 * @memberOf MarkdownEditor#dom
			 */
			root,

			/**
			 * The toolbar element.
			 *
			 * @type {HTMLElement}
			 * @memberOf MarkdownEditor#dom
			 */
			toolbar: root.querySelector( 'markdown-toolbar' ),

			/**
			 * The markdown textarea.
			 *
			 * @type {HTMLElement}
			 * @memberOf MarkdownEditor#dom
			 */
			textarea: root.querySelector( 'textarea' ),

			/**
			 * The container for the editor panels body (Write and Preview)
			 *
			 * This is <tab-container> on New Issue and Add Comment and <div> on Edit Comment.
			 *
			 * @type {HTMLElement}
			 * @memberOf MarkdownEditor#dom
			 */
			panelsContainer: root.querySelector( '.previewable-comment-form' ),

			/**
			 * The panels (body) of the markdown editor (Write and Preview).
			 *
			 * @type {Object}
			 * @memberOf MarkdownEditor#dom
			 */
			panels: {
				/**
				 * The markdown (write) panel.
				 *
				 * @type {HTMLElement}
				 * @memberOf MarkdownEditor#dom.panels
				 */
				markdown: root.querySelector( '.previewable-comment-form > file-attachment' ),

				/**
				 * The preview panel.
				 *
				 * @type {HTMLElement}
				 * @memberOf MarkdownEditor#dom.panels
				 */
				preview:
				// This one is used on New Issue and Add Comment.
					root.querySelector( '.previewable-comment-form > .js-preview-panel' ) ||
					// This one is used on Edit Comment.
					root.querySelector( '.previewable-comment-form > .preview-content' )
			}
		};
	}

	/**
	 * Gets the data currently available in the editor.
	 *
	 * @returns {String} The data in markdown format.
	 */
	getData() {
		return this.dom.textarea.value;
	}

	/**
	 * Sets the editor data.
	 *
	 * @param {String} data The new data to be set, in markdown format.
	 * @param {Boolean} reset Whether the form reset data must be also set to the new data.
	 */
	setData( data, reset = false ) {
		this.dom.textarea.value = data;

		if ( reset ) {
			this.dom.textarea.defaultValue = data;
		}
	}
}
