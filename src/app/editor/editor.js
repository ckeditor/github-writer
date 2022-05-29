/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global process */

import ModeMixin from './modemixin';
import DataMixin from './datamixin';
import { CreateEditorStaticMixin, CreateEditorInstanceMixin } from './createeditormixin';
import SetupMixin from './setupmixin';
import SubmitStatusMixin from './submitstatusmixin';
import EmitterMixin from '@ckeditor/ckeditor5-utils/src/emittermixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';

import editorModes from './modes';

import { checkDom, DomManipulator } from '../modules/util';
import utils from './utils';

let idCounter = 0;

/**
 * @mixes ModeMixin
 * @mixes DataMixin
 * @mixes CreateEditorInstanceMixin
 * @mixes SetupMixin
 * @mixes SubmitStatusMixin
 * @mixes EmitterMixin
 */
export default class Editor {
	/**
	 * @param root {HTMLElement} The root element.
	 * @mixes CreateEditorStaticMixin
	 */
	constructor( root ) {
		this.id = ++idCounter;

		this.domManipulator = new DomManipulator();

		// Expose the list of editors in the extension console in the dev build.
		{
			/* istanbul ignore next */
			if ( process.env.NODE_ENV !== 'production' ) {
				( window.GITHUB_WRITER_EDITORS = window.GITHUB_WRITER_EDITORS || [] ).push( this );
				this.domManipulator.addRollbackOperation(
					() => window.GITHUB_WRITER_EDITORS.splice( window.GITHUB_WRITER_EDITORS.indexOf( this ), 1 ) );
			}
		}

		// Setup dom.
		{
			/**
			 * The GitHub dom elements that are required for this class to operate.
			 *
			 * A check is made against these elements. If any element is missing, an error is thrown and the creation of
			 * the editor is aborted without consequences to the end user, who can still use the original markdown editor.
			 *
			 * @type {{root: HTMLElement, tabs: {write: Element}}}
			 */
			this.dom = this.getDom( root );

			this.domManipulator.addRollbackOperation( () => delete this.dom );

			checkDom( this.dom );

			// Ensure that the Write tab doesn't scroll up on click (e.g. release page).
			if ( this.dom.tabs && this.dom.tabs.write ) {
				this.domManipulator.addEventListener( this.dom.tabs.write, 'click', ev => {
					ev.preventDefault();
				} );
			}
		}

		this.placeholder = this.dom.textarea.getAttribute( 'placeholder' );

		this.domManipulator.addAttribute( root, 'data-github-writer-id', this.id );

		// Add a class for this editor type, for easy to customize specific editors.
		this.domManipulator.addClass( root, 'github-writer-' + String( this.type ).toLowerCase() );

		// Inject our classes in the dom. These will help controlling the editor through CSS.
		this.domManipulator.addClass( this.dom.panels.markdown, 'github-writer-panel-markdown' );
		this.domManipulator.addClass( this.dom.panels.preview, 'github-writer-panel-preview' );

		/**
		 * The key used to save session data.
		 * @type {string}
		 */
		this.sessionKey = 'github-writer-session:' + window.location.pathname + '?' + this.dom.textarea.id;

		utils.setupAutoResize( this );
	}

	getDom( root ) {
		const dom = {
			/**
			 * The outermost element encompassing the structure around the original GitHub markdown editor.
			 */
			root,

			/**
			 * The markdown textarea.
			 *
			 * @type {HTMLElement}
			 * @memberOf MarkdownEditor#dom
			 */
			textarea: root.querySelector( 'textarea' ),

			/**
			 * The markdown toolbar element.
			 *
			 * @type {HTMLElement}
			 * @memberOf MarkdownEditor#dom
			 */
			toolbar: root.querySelector( 'markdown-toolbar' ),

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
					root.querySelector(
						// This one is used on New Issue and Add Comment.
						'.previewable-comment-form > .js-preview-panel,' +
						// This one is used on Edit Comment.
						'.previewable-comment-form > .preview-content' )
			},

			tabs: {
				/**
				 * The "Write" tab.
				 */
				write: root.querySelector( '.write-tab' )
			},

			/**
			 * Gets the primary submit button element.
			 *
			 * This element shouldn't be cached because GH replaces it some situation, for example when data is saved.
			 *
			 * @returns {HTMLButtonElement}
			 */
			getSubmitBtn() {
				return root.querySelector( 'input[type=submit].btn-primary, button[type=submit].btn-primary' );
			},

			/**
			 * Gets the alternative submit button element, if available.
			 *
			 * This element shouldn't be cached because GH replaces it some situation, for example when data is saved.
			 *
			 * @returns {HTMLButtonElement}
			 */
			getSubmitAlternativeBtn() {
				return root.querySelector( '.js-quick-submit-alternative, button.js-save-draft' );
			}
		};

		/**
		 * Tells if the dom around the editor is like the one used to edit comments, which is different from
		 * the one used in the main editor available in the page (GH inconsistency).
		 *
		 * It should be true when editing comments and wiki pages.
		 *
		 * @type {boolean} `true` if this editor dom  like the one in comment edit.
		 */
		dom.isEdit = !!dom.panelsContainer && dom.panelsContainer.nodeName === 'DIV';

		return dom;
	}

	getSizeContainer() {
		const container = this.dom.panelsContainer;
		return this.dom.isEdit ? container : container.parentElement;
	}

	/**
	 * Moves the selection focus into the editor contents.
	 */
	focus() {
		if ( this.getMode() === editorModes.RTE ) {
			this.ckeditor && this.ckeditor.focus();
		}
	}
}

// Static properties mixins.
mix( Editor.constructor, CreateEditorStaticMixin );

// Instance properties mixins.
mix( Editor, ModeMixin, DataMixin, CreateEditorInstanceMixin, SetupMixin, SubmitStatusMixin, EmitterMixin );

/**
 * The possible modes an {Editor} can be:
 *   - RTE: the rte editor is active.
 *   - MARKDOWN: the markdown editor is active.
 *   - UNKNOWN: the current mode is not set (during initialization).
 *
 * @type {{RTE: string, MARKDOWN: string, UNKNOWN: null}}
 */
Editor.modes = editorModes;
