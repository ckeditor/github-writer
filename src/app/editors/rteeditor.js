/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import App from '../app';
import DecoupledEditor from '@ckeditor/ckeditor5-editor-decoupled/src/decouplededitor';
import GFMDataProcessor from '@ckeditor/ckeditor5-markdown-gfm/src/gfmdataprocessor';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import getRteEditorConfig from './rteeditorconfig';
import { createElementFromHtml } from '../util';

// Inject the our very own CKEditor theme overrides.
import '../theme/githubrte.css';

/**
 * The rte editor, with CKEditor 5 under the hood.
 */
export default class RteEditor {
	/**
	 * Creates a rte editor.
	 *
	 * @param {Editor} githubEditor The parent editor that uses this editor when in rte mode.
	 */
	constructor( githubEditor ) {
		/**
		 * The parent editor that uses this editor when in rte mode.
		 *
		 * @type {Editor}
		 */
		this.githubEditor = githubEditor;
	}

	/**
	 * Gets the data currently available in the editor.
	 *
	 * @returns {String} The data in markdown format.
	 */
	getData() {
		if ( this.ckeditor ) {
			return this.ckeditor.getData();
		}

		// Borrow the data from the markdown editor if this one hasn't been initialized yet.
		return this.githubEditor.markdownEditor.getData();
	}

	/**
	 * Sets the editor data.
	 *
	 * @param {String} data The new data to be set, in markdown format.
	 */
	setData( data ) {
		if ( this.ckeditor ) {
			this.ckeditor.setData( data );
		}
	}

	/**
	 * Moves the selection focus into the editor contents.
	 */
	focus() {
		this.ckeditor.editing.view.focus();
	}

	/**
	 * Injects this editor into the dom.
	 *
	 * @returns {Promise} A promise that resolves once the editor is created and ready.
	 */
	create() {
		// Just in case.
		if ( this.ckeditor ) {
			return Promise.reject( new Error( 'RteEditor.prototype.create() can be called just once.' ) );
		}

		const markdownEditor = this.githubEditor.markdownEditor;

		// Get the Markdown editor data at the exact moment of this editor creation.
		const data = markdownEditor.getData();

		// Returns the promise that follows the creation of the internal CKEditor instance.
		return CKEditorGitHubEditor.create( data, getRteEditorConfig( this ) )
			.then( editor => {
				this.injectToolbar( editor.ui.view.toolbar.element );

				// Inject the editable in the DOM within the appropriate DOM structure around it.
				{
					// Here we mimic part of the GH dom, especially because of the classes.
					const tree = createElementFromHtml( this.getEditableParentTree() );

					// Inject the editor in the above tree.
					tree.querySelector( '.github-rte-ckeditor' ).append( editor.ui.getEditableElement() );

					if ( markdownEditor.isEdit ) {
						// On edit, the GH dom is totally different. Add the editor after the preview panel.
						markdownEditor.dom.panels.preview.insertAdjacentElement( 'afterend', tree );
					} else {
						// Add the editor after the actual GH panels container, to avoid the GH panels show/hide logic to touch it.
						markdownEditor.dom.panelsContainer.insertAdjacentElement( 'afterend', tree );
					}
				}

				// Post-fix to enable the GH tooltip on the toolbar. (Items are already rendered)
				toolbarItemsPostfix( editor.ui.view.toolbar );

				// Expose the main objects of the API, for cross logic.
				editor.githubEditor = this.githubEditor;
				this.ckeditor = editor;

				// TODO: check if possible to fire Editor('ready') when everything is really ready.
				/**
				 * Fired when the whole creation logic of the editor is finished.
				 *
				 * @memberOf CKEditorGitHubEditor
				 */
				editor.fire( 'reallyReady' );
			} );
	}

	/**
	 * Injects the CKEditor toolbar into the dom.
	 *
	 * @param {HTMLElement} toolbarElement The CKEditor toolbar element.
	 */
	injectToolbar( toolbarElement ) {
		// Inject the rte toolbar right next to the markdown editor toolbar.
		this.githubEditor.markdownEditor.dom.toolbar.insertAdjacentElement( 'afterend', toolbarElement );
	}

	/**
	 * Gets the html of the parent tree where the CKEditor editable must be placed in. The editable will be
	 * injected inside the element with class `.github-rte-ckeditor`.
	 *
	 * @returns {String} The parent tree html.
	 */
	getEditableParentTree() {
		// Mimic the minimum set of classes that are necessary for the editor, and its contents,
		// to look like GitHub originals.
		return `
			<div class="github-rte-panel-rte write-content mx-0 mt-2 mb-2 mx-md-2">
				<div class="github-rte-ckeditor upload-enabled form-control input-contrast
					comment-form-textarea comment-body markdown-body"></div>
			</div>
		`;
	}
}

/**
 * The CKEditor used inside the rte editor.
 */
class CKEditorGitHubEditor extends DecoupledEditor {
	constructor( initialData, config ) {
		super( initialData, config );

		// TODO: Check if there is a better way to set the data processor without having to override DecoupledEditor.
		this.data.processor = new GFMDataProcessor();

		// Adds our very own class to the toolbar.
		this.ui.view.toolbar.extendTemplate( {
			attributes: {
				class: 'github-rte-toolbar'
			}
		} );

		// TODO: Check if there is any interest of having this in core.
		/**
		 * Tells if the editor content is empty.
		 *
		 * @observable
		 * @readonly
		 * @member {Boolean} #isEmpty
		 */
		{
			const document = this.model.document;
			this.listenTo( document, 'change:data', () => {
				this.set( 'isEmpty', !document.model.hasContent( document.getRoot() ) );
			} );
		}
	}
}

/**
 *Fixes the toolbar buttons label so they look exactly like the original GH ones (minor detail).
 *
 * @param {ToolbarView} toolbar The toolbar to be tweaked.
 * @param  {String} tooltipPosition='n' The tooltip position: 'n' (north, top) or 's' (south, bottom).
 */
// Used by the Kebab plugin as well, so we're exporting.
export function toolbarItemsPostfix( toolbar, tooltipPosition = 'n' ) {
	// Postfix is possible only in pages type "comments" (not "wiki").
	if ( App.pageManager.type !== 'comments' ) {
		return;
	}

	// The list of labels to be replaced. The keys are the default CKEditor labels.
	const labels = {
		// Get the original labels used in GH.
		'Bold': document.querySelector( 'md-bold' ).getAttribute( 'aria-label' ),
		'Italic': document.querySelector( 'md-italic' ).getAttribute( 'aria-label' ),
		'Block quote': document.querySelector( 'md-quote' ).getAttribute( 'aria-label' ),
		'Code': document.querySelector( 'md-code' ).getAttribute( 'aria-label' ),
		'Link': document.querySelector( 'md-link' ).getAttribute( 'aria-label' ),
		'Bulleted List': document.querySelector( 'md-unordered-list' ).getAttribute( 'aria-label' ),
		'Numbered List': document.querySelector( 'md-ordered-list' ).getAttribute( 'aria-label' ),
		'To-do List': document.querySelector( 'md-task-list' ).getAttribute( 'aria-label' ),

		// With our additions, matching the GH language style (more verbose).
		'Strikethrough': 'Add strikethrough text',
		'Horizontal line': 'Insert a horizontal line',
		'Insert image': 'Insert an image',
		'Insert table': 'Insert a table',
		'Remove Format': 'Remove text formatting'
	};

	const items = Array.from( toolbar.items );

	items.forEach( item => {
		// Some items, like Drop Downs and File Dialog, are containers for their buttons. Take the inner button then.
		if ( item.buttonView ) {
			item = item.buttonView;
		}

		if ( item instanceof ButtonView ) {
			const itemLabel = labels[ item.label ] || item.label;

			// Disable the CKEditor tooltip as we'll use the GH lib for that.
			item.set( 'tooltip', false );

			// If it is already rendered, we touch the dom.
			if ( item.isRendered ) {
				// Make the necessary changes for the GH tooltip to work.
				// Set the text visible in the tooltip.
				item.element.setAttribute( 'aria-label', itemLabel );
				// Enable tooltips.
				item.set( 'class', ( ( item.class || '' ) + ' tooltipped tooltipped-' + tooltipPosition ).trim() );
			}
			// Otherwise, we touch the template used for rendering.
			else {
				item.extendTemplate( {
					attributes: {
						// Make the necessary changes for the GH tooltip to work.
						// Set the text visible in the tooltip.
						'aria-label': itemLabel,
						// Enable tooltips.
						'class': 'tooltipped tooltipped-' + tooltipPosition
					}
				} );
			}
		}
	} );
}
