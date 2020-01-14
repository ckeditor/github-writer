/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global process */

import App from './app';

import MarkdownEditor from './editors/markdowneditor';
import RteEditor from './editors/rteeditor';
import WikiMarkdownEditor from './editors/wikimarkdowneditor';
import WikiRteEditor from './editors/wikirteeditor';

import EmitterMixin from '@ckeditor/ckeditor5-utils/src/emittermixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';

import { checkDom } from './util';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';

// Gets the proper editor classes to be used, based on the type of page we're in.
function getEditorClasses() {
	const isWiki = App.pageManager.type === 'wiki';
	return {
		MarkdownEditor: isWiki ? WikiMarkdownEditor : MarkdownEditor,
		RteEditor: isWiki ? WikiRteEditor : RteEditor
	};
}

/**
 * A GitHub RTE editor, which is a complex editor containing two switchable editing modes: RTE and Markdown.
 * It is created around a standard GitHub markdown editor, enhancing it.
 *
 * @mixes EmitterMixin
 */
export default class Editor {
	/**
	 * Creates a GitHub RTE editor.
	 *
	 * @param {HTMLElement} markdownEditorRootElement The outermost element that contains the complete dom of a single
	 * GitHub markdown editor.
	 */
	constructor( markdownEditorRootElement ) {
		// This will expose the list of editors in the extension console in the dev build.
		if ( process.env.NODE_ENV !== 'production' ) {
			( window.GITHUB_RTE_EDITORS = window.GITHUB_RTE_EDITORS || [] ).push( this );
		}

		{
			/**
			 * The GitHub dom elements that are required for this class to operate.
			 *
			 * A check is made against these elements. If any element is missing, an error is thrown and the creation of
			 * the editor is aborted without consequences to the end user, who can still use the original markdown editor.
			 *
			 * @type {{root: HTMLElement, tabs: {write: Element}}}
			 */
			this.dom = {
				/**
				 * The outermost element encompassing the structure around the original GitHub markdown editor.
				 */
				root: markdownEditorRootElement,
				tabs: {
					/**
					 * The "Write" tab.
					 */
					write: markdownEditorRootElement.querySelector( '.write-tab' )
				}
			};

			checkDom( this.dom );
		}

		{
			// Take the proper classes to be used to create the editors.
			const { MarkdownEditor, RteEditor } = getEditorClasses();

			/**
			 * The markdown editor used by this editor.
			 * @type {MarkdownEditor|WikiMarkdownEditor}
			 */
			this.markdownEditor = new MarkdownEditor( this );

			/**
			 * The rte editor used by the editor.
			 * @type {RteEditor|WikiRteEditor}
			 */
			this.rteEditor = new RteEditor( this );

			// Mark the root when in a Wiki page, to enable a whole world of dedicated CSS for it.
			if ( this.markdownEditor instanceof WikiMarkdownEditor ) {
				markdownEditorRootElement.classList.add( 'github-rte-type-wiki' );
			}
		}
	}

	/**
	 * The currently active in the editor.
	 *
	 * @returns {String|null} One of the {Editor.modes}.
	 */
	getMode() {
		// Take the mode from the dom directly.
		if ( this.dom.root.classList.contains( 'github-rte-mode-rte' ) ) {
			return Editor.modes.RTE;
		} else if ( this.dom.root.classList.contains( 'github-rte-mode-markdown' ) ) {
			return Editor.modes.MARKDOWN;
		}
		return Editor.modes.UNKNOWN;
	}

	/**
	 * Activates a given mode into the editor.
	 *
	 * When activating a mode, the following operations are, by default, executed:
	 *   1. The data from the active editor is copied to the editor of the new mode.
	 *   2. If moving to the rte mode, a check for data loss is done, following the above step. If loss is detected,
	 *      a confirmation message is displayed to the user.
	 *
	 * @param {String} mode Either {Editor.modes.RTE} or {Editor.modes.MARKDOWN}.
	 * @param {Object} [options] Options to configure the execution of setMode().
	 * @param {Boolean} [options.noSynch=false] Do not synchronize the inner editors data before changing mode.
	 * @param {Boolean} [options.noCheck=false] Do not perform data loss checks.
	 * @fires Editor#mode
	 */
	setMode( mode, options = { noSynch: false, noCheck: false } ) {
		const currentMode = this.getMode();

		if ( currentMode === mode ) {
			return;
		}

		if ( !options.noSynch ) {
			this.syncEditors();
		}

		// If moving markdown -> rte.
		if ( !options.noCheck && currentMode === Editor.modes.MARKDOWN && mode === Editor.modes.RTE ) {
			if ( this._checkDataLoss() ) {
				// eslint-disable-next-line no-alert
				if ( !confirm( `This markdown contains markup that may not be compatible with the rich-text editor and may be lost.\n` +
					`\n` +
					`Do you confirm you want to switch to rich-text?` ) ) {
					return;
				}
			}
		}

		// Ensure that we have the write tab active otherwise the preview may still be visible.
		if ( currentMode !== Editor.modes.UNKNOWN ) {
			this.dom.tabs.write.click();
		}

		// Set the appropriate class to the root element according to the mode being set.
		this.dom.root.classList.toggle( 'github-rte-mode-rte', mode === Editor.modes.RTE );
		this.dom.root.classList.toggle( 'github-rte-mode-markdown', mode === Editor.modes.MARKDOWN );

		/**
		 * Fired after a new mode has been activated in the editor.
		 *
		 * @event Editor#mode
		 */
		this.fire( 'mode' );
	}

	/**
	 * Creates and injects this editor into the page.
	 *
	 * @returns {Promise<Editor>} A promise that resolves once the rte editor instance used by this editor is created and ready.
	 */
	create() {
		return this.rteEditor.create()
			.then( () => {
				this._setupFocus();
				this._setupEmptyCheck();
				this._setupForm();
				this._setupEnter();
				this._setInitialMode();

				return this;
			} );
	}

	/**
	 * Copies the data from the editor of the currently active mode to the other mode editor.
	 *
	 * This operation is done when switching modes and before form post.
	 */
	syncEditors() {
		if ( this.getMode() === Editor.modes.RTE ) {
			this.markdownEditor.setData( this.rteEditor.getData() );
		} else {
			this.rteEditor.setData( this.markdownEditor.getData() );
		}
	}

	/**
	 * Simulates the native "quote selection" feature from GitHub (the "r" key).
	 *
	 * Basically, if the RTE editor is active, execute quote-selection in it. If the markdown editor is enabled instead,
	 * do nothing and let the defautl behavior to happen (GH handles it).
	 *
	 * @param selectionMarkdown The markdown text to be quoted, most likely derived from the user selection.
	 */
	quoteSelection( selectionMarkdown ) {
		if ( this.getMode() === Editor.modes.RTE ) {
			this.rteEditor.ckeditor.quoteSelection( selectionMarkdown );
		}
	}

	/**
	 * Setups focus related features.
	 *
	 * @private
	 */
	_setupFocus() {
		// Enable editor focus when clicking the "Write" tab.
		this.dom.tabs.write.addEventListener( 'click', () => {
			setTimeout( () => {
				this.rteEditor.focus();
			}, 0 );
		} );

		// Enable the GitHub focus styles when the editor focus/blur.
		{
			// Take the element that GH would styles on focus.
			const focusBox = this.dom.root.querySelector( '.github-rte-ckeditor' );

			// Watch for editor focus changes.
			this.rteEditor.ckeditor.ui.focusTracker.on( 'change:isFocused', ( evt, name, value ) => {
				focusBox.classList.toggle( 'focused', !!value );
			} );
		}
	}

	/**
	 * Setup empty checks in the rte editor that influence the page behavior.
	 *
	 * @private
	 */
	_setupEmptyCheck() {
		// Enable/disable the submit buttons based on the editor emptyness.
		this.rteEditor.ckeditor.on( 'change:isEmpty', ( eventInfo, name, isEmpty ) => {
			if ( this.getMode() === Editor.modes.RTE ) {
				// Take the GH textarea, which is now hidden.
				const textarea = this.markdownEditor.dom.textarea;

				// Add a bit of "safe dirt" to the GH textarea.
				textarea.value = textarea.defaultValue + ( isEmpty ? '' : '\n<!-- -->' );

				// Fire the change event, so GH will update the submit buttons.
				textarea.dispatchEvent( new Event( 'change' ) );		// "Close issue" button.
				textarea.form.dispatchEvent( new Event( 'change' ) );	// "Comment" button.
			}
		} );
	}

	/**
	 * Setups the form submit and reset.
	 *
	 * @private
	 */
	_setupForm() {
		const form = this.markdownEditor.dom.textarea.form;

		// Update the textarea on form post.
		form.addEventListener( 'submit', () => {
			// If in RTE, update the markdown textarea with the data to be submitted.
			if ( this.getMode() === Editor.modes.RTE ) {
				this.syncEditors();
			}
		} );

		// Reset the rte editor on form reset (e.g. after a new comment is added).
		form.addEventListener( 'reset', () => {
			// We actually want it 'after-reset', so form elements are clean, thus setTimeout.
			setTimeout( () => {
				this.rteEditor.setData( this.markdownEditor.dom.textarea.defaultValue );
				this._setInitialMode();
			}, 0 );
		} );

		// Sync the editors when navigating away from this page, so content will load again when moving back.
		window.addEventListener( 'pagehide', () => {
			if ( this.getMode() === Editor.modes.RTE ) {
				this.syncEditors();
			}
		} );
	}

	/**
	 * Implements what GH calls "Quick Submit", and way to submit the form using (Shift+)Cmd/Ctrl+Enter.
	 *
	 * @private
	 */
	_setupEnter() {
		const viewDocument = this.rteEditor.ckeditor.editing.view.document;

		viewDocument.on( 'keydown', ( eventInfo, data ) => {
			if ( data.keyCode === keyCodes.enter ) {
				if ( data.ctrlKey && !data.altKey ) {
					// By looking the GH code, it would be enough, and a better implementation, to re-dispatch the
					// keydown event in the markdown textarea. For some unknown reason this is not working.
					// {
					// 	const domEvent = data.domEvent;
					//
					// 	const keyEvent = new KeyboardEvent( 'keydown', {
					// 		key: domEvent.key,
					// 		ctrlKey: domEvent.ctrlKey,
					// 		altKey: domEvent.altKey,
					// 		metaKey: domEvent.metaKey,
					// 		repeat: domEvent.repeat,
					// 	} );
					//
					// 	this.markdownEditor.dom.textarea.dispatchEvent( keyEvent );
					// }

					// As the above strategy is not working, we do exactly the same as the GH code is doing.
					{
						const form = this.markdownEditor.dom.textarea.form;
						let e;

						if ( data.shiftKey ) {
							e = form.querySelector( '.js-quick-submit-alternative' );
						} else {
							e = form.querySelector(
								'input[type=submit]:not(.js-quick-submit-alternative),' +
								'button[type=submit]:not(.js-quick-submit-alternative)' );
						}

						e && e.click();
					}
				}
			}
		}, { priority: 'high' } );
	}

	/**
	 * Sets the most appropriate mode for this editor on startup.
	 *
	 * It defaults to rte but, when editing existing data, it may happen that the markdown to be loaded is not
	 * compatible with the rte editor. In such case, start on markdown mode and let the it to user to decide whether
	 * to move to rte or not by using the ui.
	 *
	 * @private
	 */
	_setInitialMode() {
		this.setMode( this._checkDataLoss() ? Editor.modes.MARKDOWN : Editor.modes.RTE,
			{ noSynch: true, noCheck: true } );
	}

	/**
	 * Checks if the data present in the rte editor may indicate a potential for data loss when compared
	 * to the data in the markdown editor.
	 *
	 * @private
	 */
	_checkDataLoss() {
		// The trick is very simple. Both editor produce markdown, so we check if the one produced with the rte editor
		// is semantically similar to the one in the markdown editor.

		const rteData = this.rteEditor.getData();
		const markdownData = this.markdownEditor.getData();

		return stripSpaces( rteData ) !== stripSpaces( markdownData );

		function stripSpaces( text ) {
			return text.replace( /\s/g, '' );
		}
	}
}

mix( Editor, EmitterMixin );

/**
 * The possible modes an {Editor} can be:
 *   - RTE: the rte editor is active.
 *   - MARKDOWN: the markdown editor is active.
 *   - UNKNOWN: the current mode is not set (during initialization).
 *
 * @type {{RTE: string, MARKDOWN: string, UNKNOWN: null}}
 */
Editor.modes = {
	RTE: 'rte',
	MARKDOWN: 'markdown',
	UNKNOWN: null
};
