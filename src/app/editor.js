/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { copyElement } from './util';

import GitHubEditor from '../ckeditor/githubeditor';
import getMentionFeedsConfig from '../ckeditor/githubmentionfeeds';

import Heading from './features/heading';
import Bold from './features/bold';
import Italic from './features/italic';
import Code from './features/code';
import BlockQuote from './features/blockquote';
import BulletedList from './features/bulletedlist';
import NumberedList from './features/numberedlist';
import TodoList from './features/todolist';
import Link from './features/link';

const featureClasses = [
	Heading,
	Bold, Italic, Code,
	BlockQuote,
	BulletedList, NumberedList, TodoList,
	Link
];

let mentionFeedsConfig;

export default class Editor {
	/**
	 * Creates a GitHub RTE editor.
	 *
	 * @param markdownEditorRootElement {HTMLElement} The element that contains the complete DOM of a single GitHub markdown
	 * editor.
	 */
	constructor( markdownEditorRootElement ) {
		// Find the GitHub UI elements to be touched by the editor logic.

		// The element holding the toolbar.
		const toolbar = markdownEditorRootElement.querySelector( 'markdown-toolbar' );

		// The markdown textarea.
		const textarea = markdownEditorRootElement.querySelector( '#' + toolbar.getAttribute( 'for' ) );

		// The form that posts the data.
		const form = textarea.form;

		// The element to be highlighted when the editor has focus.
		const focusBox = markdownEditorRootElement.querySelector( 'div.upload-enabled' );

		// The element holding upload related data.
		const uploadData = textarea.closest( '*[data-upload-policy-url]' );

		this.dom = {
			root: markdownEditorRootElement,
			toolbar,
			textarea,
			form,
			focusBox,
			uploadData,
			// The element containing the upload data is also the outermost element that we need to replicate to mimic
			// the GH design around the textarea.
			editableRoot: uploadData
		};

		// Get the GH DOM element that holds the urls from which retrieve mentions.
		// Singleton: do it for the first editor created and use it among all editors.
		if ( !mentionFeedsConfig ) {
			const textExpanderElement = textarea.closest( 'text-expander' );
			mentionFeedsConfig = getMentionFeedsConfig( {
				issues: textExpanderElement.getAttribute( 'data-issue-url' ),
				people: textExpanderElement.getAttribute( 'data-mention-url' ),
				emoji: textExpanderElement.getAttribute( 'data-emoji-url' )
			} );
		}

		// When bootstraping, we're on markdown mode.
		this.mode = Editor.modes.MARKDOWN;

		// This will expose the list of editors in the extension console.
		( window.GITHUB_RTE_EDITORS = window.GITHUB_RTE_EDITORS || [] ).push( this );
	}

	get mode() {
		if ( this.dom.root.classList.contains( 'github-rte-mode-rte' ) ) {
			return Editor.modes.RTE;
		}

		if ( this.dom.root.classList.contains( 'github-rte-mode-markdown' ) ) {
			return Editor.modes.MARKDOWN;
		}

		return null;
	}

	set mode( mode ) {
		if ( mode == Editor.modes.MARKDOWN ) {
			if ( this.mode == Editor.modes.RTE ) {
				this.updateTextarea();
			}
		} else if ( mode == Editor.modes.RTE ) {
			// A small trick to enable the submit button while the editor is visible.
			this.dom.textarea.textContent += ' ';
		} else {
			throw new Error( 'Unknown mode "' + mode + '"' );
		}

		// Set the appropriate class to the root element according to the mode being set.
		this.dom.root.classList.toggle( 'github-rte-mode-rte', mode == Editor.modes.RTE );
		this.dom.root.classList.toggle( 'github-rte-mode-markdown', mode == Editor.modes.MARKDOWN );
	}

	updateTextarea() {
		if ( this.mode == Editor.modes.RTE ) {
			this.dom.textarea.textContent = this.editor.getData();
		}
	}

	create() {
		// Take the initial markdown data to be loaded in the editor.
		const data = this.dom.textarea.value;

		GitHubEditor.create( data, {
			mention: {
				feeds: mentionFeedsConfig
			}
		} ).then( editor => {
			this.editor = editor;

			// Save DOM information about file upload (used by the GitHubUploadAdapter plugin).
			{
				editor.config.set( 'githubRte.upload.uploadUrl', this.dom.uploadData.getAttribute( 'data-upload-policy-url' ) );
				editor.config.set( 'githubRte.upload.form', {
					authenticity_token: this.dom.uploadData.getAttribute( 'data-upload-policy-authenticity-token' ),
					repository_id: this.dom.uploadData.getAttribute( 'data-upload-repository-id' )
				} );
			}

			// Create the outer div that will hold the editable and inherit some of the original GitHub styles.
			let outer = document.createElement( 'div' );
			outer.classList.add(
				'github-rte-ckeditor',
				// GH textarea classes.
				'form-control',
				'input-contrast',
				'comment-form-textarea',
				// GH rendered output classes.
				'comment-body',
				'markdown-body' );

			// Inject the editor inside the outer div.
			outer.append( editor.ui.getEditableElement() );

			// Create a copy of the parent tree of the textarea (using divs only) up to the editableRoot,
			// so we'll mimic the styles used by GH by copying the CSS classes of this tree.
			{
				let parent = this.dom.textarea;
				let parentClone;

				while ( parent != this.dom.editableRoot ) {
					parent = parent.parentElement;
					parentClone = copyElement( parent, 'div', false );
					parentClone.appendChild( outer );
					outer = parentClone;
				}
			}

			// Add the classes that will be used to switch the visibility of the textarea vs CKEditor.
			this.dom.editableRoot.classList.add( 'github-rte-editableroot-markdown' );
			outer.classList.add( 'github-rte-editableroot-rte' );

			// Place the outer/editor right after the textarea root in the DOM.
			this.dom.editableRoot.insertAdjacentElement( 'afterend', outer );

			// Enable the GitHub focus styles when the editor focus/blur.
			editor.ui.focusTracker.on( 'change:isFocused', ( evt, name, value ) => {
				this.dom.focusBox.classList.toggle( 'focused', !!value );
			} );

			// Update the textarea on form post.
			this.dom.form.addEventListener( 'submit', () => {
				this.updateTextarea();
			} );

			this.dom.form.addEventListener( 'reset', () => {
				editor.setData( '' );
			} );

			// ### Setup features.

			// Mark all original toolbar items with our very own class.
			this.dom.toolbar.querySelectorAll( '.toolbar-item' ).forEach( element => {
				element.classList.add( 'github-rte-button-markdown' );
			} );

			// Attach each feature to the editor.
			featureClasses.forEach( Feature => {
				const feature = new Feature( this );
				feature.attach();
			} );

			// ### Done.

			// All done. Set the current editor mode.
			this.mode = Editor.modes.RTE;
		} );
	}
}

Editor.modes = {
	RTE: 'rte',
	MARKDOWN: 'markdown'
};
