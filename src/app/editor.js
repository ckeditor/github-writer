/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import GitHubEditor from '../ckeditor/githubeditor';

import Bold from './features/bold';
import Italic from './features/italic';
import Heading from './features/heading';

const featureClasses = [ Bold, Italic, Heading ];

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

		this.dom = {
			root: markdownEditorRootElement,
			toolbar,
			textarea,
			form,
			focusBox
		};

		// When bootstraping, we're on markdown mode.
		this.mode = Editor.modes.MARKDOWN;
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

		GitHubEditor.create( data )
			.then( editor => {
				this.editor = editor;

				// Create the outer div that will inherit some of the original GitHub styles.
				const outer = document.createElement( 'div' );
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

				// Enable the GitHub focus styles when the editor focus/blur.
				editor.ui.focusTracker.on( 'change:isFocused', ( evt, name, value ) => {
					this.dom.focusBox.classList.toggle( 'focused', !!value );
				} );

				// Place the outer/editor right after the textarea in the DOM.
				this.dom.textarea.insertAdjacentElement( 'afterend', outer );

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
