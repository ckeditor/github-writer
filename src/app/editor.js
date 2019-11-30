/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import MarkdownEditor from './editors/markdowneditor';
import RteEditor from './editors/rteeditor';
import EmitterMixin from '@ckeditor/ckeditor5-utils/src/emittermixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';
import { checkDom } from './util';

export default class Editor {
	/**
	 * Creates a GitHub RTE editor.
	 *
	 * @param markdownEditorRootElement {HTMLElement} The element that contains the complete DOM of a single GitHub markdown
	 * editor.
	 */
	constructor( markdownEditorRootElement ) {
		// This will expose the list of editors in the extension console.
		( window.GITHUB_RTE_EDITORS = window.GITHUB_RTE_EDITORS || [] ).push( this );

		this.dom = {
			root: markdownEditorRootElement,
			tabs: {
				write: markdownEditorRootElement.querySelector( '.write-tab' )
			}
		};

		checkDom( this.dom );

		this.markdownEditor = new MarkdownEditor( this );
		this.rteEditor = new RteEditor( this );
	}

	getMode() {
		if ( this.dom.root.classList.contains( 'github-rte-mode-rte' ) ) {
			return Editor.modes.RTE;
		} else if ( this.dom.root.classList.contains( 'github-rte-mode-markdown' ) ) {
			return Editor.modes.MARKDOWN;
		}
		return Editor.modes.UNKNOWN;
	}

	setMode( mode, options = { noSynch: false, noCheck: false } ) {
		const currentMode = this.getMode();

		if ( currentMode === mode ) {
			return;
		}

		if ( !options.noSynch ) {
			this.syncEditors();
		}

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

		// Ensure that we have the write tab active (not preview).
		if ( currentMode !== Editor.modes.UNKNOWN ) {
			this.dom.tabs.write.click();
		}

		// Set the appropriate class to the root element according to the mode being set.
		this.dom.root.classList.toggle( 'github-rte-mode-rte', mode === Editor.modes.RTE );
		this.dom.root.classList.toggle( 'github-rte-mode-markdown', mode === Editor.modes.MARKDOWN );

		this.fire( 'mode' );
	}

	create() {
		return this.rteEditor.create()
			.then( () => {
				this._setupFocus();
				this._setupEmptyCheck();
				this._setupForm();
				this._setInitialMode();
			} );
	}

	syncEditors() {
		if ( this.getMode() === Editor.modes.RTE ) {
			this.markdownEditor.setData( this.rteEditor.getData() );
		} else {
			this.rteEditor.setData( this.markdownEditor.getData() );
		}
	}

	_setupFocus() {
		// Enable editor focus when clicking the "Write" tab.
		this.dom.tabs.write.addEventListener( 'click', () => {
			setTimeout( () => {
				this.rteEditor.focus();
			}, 0 );
		} );

		// Enable the GitHub focus styles when the editor focus/blur.
		{
			// Take the element that GH styles on focus.
			const focusBox = this.dom.root.querySelector( '.github-rte-ckeditor' );

			// Watch for editor focus changes.
			this.rteEditor.ckeditor.ui.focusTracker.on( 'change:isFocused', ( evt, name, value ) => {
				focusBox.classList.toggle( 'focused', !!value );
			} );
		}
	}

	_setupEmptyCheck() {
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

	_setupForm() {
		const form = this.markdownEditor.dom.textarea.form;

		// Update the textarea on form post.
		form.addEventListener( 'submit', () => {
			// If in RTE, update the markdown textarea with the data to be submitted.
			if ( this.getMode() === Editor.modes.RTE ) {
				this.syncEditors();
			}
		} );

		form.addEventListener( 'reset', () => {
			// We actually want it 'after-reset', so form elements are clean, thus setTimeout.
			setTimeout( () => {
				this.rteEditor.setData( this.markdownEditor.dom.textarea.defaultValue );
				this._setInitialMode();
			}, 0 );
		} );
	}

	_setInitialMode() {
		// For safety, if the editor is not handling well the markdown data, stays in Markdown mode.
		this.setMode( this._checkDataLoss() ? Editor.modes.MARKDOWN : Editor.modes.RTE,
			{ noSynch: true, noCheck: true } );
	}

	/**
	 * Checks if the current data loaded in CKEditor is different (semantically) from the markdown available in the GH textarea.
	 * @private
	 */
	_checkDataLoss() {
		const rteData = this.rteEditor.getData();
		const markdownData = this.markdownEditor.getData();

		return stripSpaces( rteData ) !== stripSpaces( markdownData );

		function stripSpaces( text ) {
			return text.replace( /\s/g, '' );
		}
	}
}

mix( Editor, EmitterMixin );

Editor.modes = {
	RTE: 'rte',
	MARKDOWN: 'markdown',
	UNKNOWN: null
};
