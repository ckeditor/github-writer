/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import MarkdownEditor from './editors/markdowneditor';
import RteEditor from './editors/rteeditor';
import EmitterMixin from '@ckeditor/ckeditor5-utils/src/emittermixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';

const markdownModeTag = '<!-- GitHub RTE: { mode:markdown } -->';

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

		this.markdownEditor = new MarkdownEditor( markdownEditorRootElement );

		// Get the initial data loaded from GH.
		const data = this.markdownEditor.getData();

		this.rteEditor = new RteEditor( this );

		this.dom = {
			root: markdownEditorRootElement
		};

		this._setupForm();
		this._setInitialMode( data );
	}

	get mode() {
		if ( this.dom.root.classList.contains( 'github-rte-mode-rte' ) ) {
			return Editor.modes.RTE;
		} else {
			return Editor.modes.MARKDOWN;
		}
	}

	set mode( mode ) {
		this.syncEditors();

		// Set the appropriate class to the root element according to the mode being set.
		this.dom.root.classList.toggle( 'github-rte-mode-rte', mode === Editor.modes.RTE );
		this.dom.root.classList.toggle( 'github-rte-mode-markdown', mode === Editor.modes.MARKDOWN );

		// This will enable the submit button.
		// TODO: check if possible to remove setTimeout (ideally a document ready event).
		setTimeout( () => {
			const textarea = this.markdownEditor.dom.textarea;
			if ( mode === Editor.modes.RTE ) {
				// A small trick to enable the submit button while the editor is visible.
				// TODO: ideally we should do this by checking if the editor contents changed.
				if ( textarea.value === textarea.defaultValue ) {
					textarea.value += '\n<!-- -->';
				}
			}
			textarea.dispatchEvent( new Event( 'change' ) );
			textarea.form.dispatchEvent( new Event( 'change' ) );
		}, 100 );

		this.fire( 'mode' );
	}

	syncEditors() {
		if ( this.mode === Editor.modes.RTE ) {
			this.markdownEditor.setData( this.rteEditor.getData() );
		} else {
			this.rteEditor.setData( this.markdownEditor.getData() );
		}
	}

	_setupForm() {
		const form = this.markdownEditor.dom.textarea.form;

		// Update the textarea on form post.
		form.addEventListener( 'submit', () => {
			// If in RTE, update the markdown textarea with the data to be submitted.
			if ( this.mode === Editor.modes.RTE ) {
				this.syncEditors();
			} else {
				// Mark the content so the next editing attempt will default to markdown.
				let data = this.markdownEditor.getData();

				// Remove any trailing \n, and add it back with the tag.
				data = data.replace( /\n$/, '' );
				data += '\n\n' + markdownModeTag;

				this.markdownEditor.setData( data );
			}
		} );

		form.addEventListener( 'reset', () => {
			this.rteEditor.setData( this.markdownEditor.dom.textarea.defaultValue );
		} );
	}

	_setInitialMode( data ) {
		let startMode = Editor.modes.RTE;

		// Sniff the start mode of the editor. Stays on markdown if the user posted at markdown.
		if ( ( new RegExp( markdownModeTag ) ).test( data ) ) {
			startMode = Editor.modes.MARKDOWN;
			data = data.replace( new RegExp( '\\n{0,2}' + markdownModeTag, 'g' ), '' );

			// Remove the tag from the textarea, like it never existed.
			this.rteEditor.setData( data, true );
		}

		this.mode = startMode;
	}

	create() {
		return this.rteEditor.create()
			.then( () => {
				// Enable the GitHub focus styles when the editor focus/blur.
				{
					// Take the element that GH styles on focus.
					const focusBox = this.dom.root.querySelector( '.github-rte-editableroot-rte div.write-content' );

					// Watch for editor focus changes.
					this.rteEditor.ckeditor.ui.focusTracker.on( 'change:isFocused', ( evt, name, value ) => {
						focusBox.classList.toggle( 'focused', !!value );
					} );
				}
			} );
	}
}

mix( Editor, EmitterMixin );

Editor.modes = {
	RTE: 'rte',
	MARKDOWN: 'markdown'
};
