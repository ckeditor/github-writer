/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import DecoupledEditor from '@ckeditor/ckeditor5-editor-decoupled/src/decouplededitor';
import GFMDataProcessor from '@ckeditor/ckeditor5-markdown-gfm/src/gfmdataprocessor';
import getRteEditorConfig from './rteeditorconfig';
import { copyElement } from '../util';

export default class RteEditor {
	constructor( githubEditor ) {
		this.githubEditor = githubEditor;
	}

	getData() {
		if ( this.ckeditor ) {
			return this.ckeditor.getData();
		}

		return this.githubEditor.markdownEditor.getData();
	}

	setData( data ) {
		if ( this.ckeditor ) {
			this.ckeditor.setData( data );
		}
	}

	create() {
		const data = this.getData();

		return CKEditorGitHubEditor.create( data, getRteEditorConfig( this ) )
			.then( editor => {
				const markdownEditor = this.githubEditor.markdownEditor;

				editor.githubEditor = this.githubEditor;

				// Append the rte toolbar right next to the markdown editor toolbar.
				markdownEditor.dom.toolbar.insertAdjacentElement( 'afterend', editor.ui.view.toolbar.element );

				// Inject the editable in the DOM within the appropriate DOM structure around it.
				{
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

					// The element containing the upload data is also the outermost element that we need to replicate to mimic
					// the GH design around the textarea.
					const editableRoot = markdownEditor.dom.textarea.closest( '*[data-upload-policy-url]' );

					// Create a copy of the parent tree of the textarea (using divs only) up to the editableRoot,
					// so we'll mimic the styles used by GH by copying the CSS classes of this tree.
					{
						let parent = markdownEditor.dom.textarea;
						let parentClone;

						while ( parent !== editableRoot ) {
							parent = parent.parentElement;
							parentClone = copyElement( parent, 'div', false );
							parentClone.appendChild( outer );
							outer = parentClone;
						}
					}

					// Add the classes that will be used to switch the visibility of the textarea vs CKEditor.
					editableRoot.classList.add( 'github-rte-editableroot-markdown' );
					outer.classList.add( 'github-rte-editableroot-rte' );

					// Place the outer/editor right after the textarea root in the DOM.
					editableRoot.insertAdjacentElement( 'afterend', outer );
				}

				this.ckeditor = editor;
			} );
	}
}

// TODO: Check if there is a better way to set the data processor without having to override DecoupledEditor.
class CKEditorGitHubEditor extends DecoupledEditor {
	constructor( initialData, config ) {
		super( initialData, config );

		this.data.processor = new GFMDataProcessor();

		this.ui.view.toolbar.extendTemplate( {
			attributes: {
				class: 'github-rte-toolbar'
			}
		} );
	}
}
