/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import App from '../app';
import CKEditorGitHubEditor from './ckeditorgithubeditor';
import RteEditorConfig from './rteeditorconfig';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import env from '@ckeditor/ckeditor5-utils/src/env';

// Inject our very own CKEditor theme overrides.
import '../theme/githubwriter.css';

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
		return this._pendingData || '';
	}

	/**
	 * Sets the editor data.
	 *
	 * @param {String} data The new data to be set, in markdown format.
	 */
	setData( data ) {
		if ( this.ckeditor ) {
			this.ckeditor.setData( data );
		} else {
			this._pendingData = data;
		}
	}

	/**
	 * Moves the selection focus into the editor contents.
	 */
	focus() {
		this.ckeditor && this.ckeditor.focus();
	}

	/**
	 * Injects this editor into the dom.
	 *
	 * @returns {Promise} A promise that resolves once the editor is created and ready.
	 */
	create( initialData ) {
		if ( this._creationPromise ) {
			return this._creationPromise;
		}

		// Returns the promise that follows the creation of the internal CKEditor instance.
		return ( this._creationPromise = CKEditorGitHubEditor.create( initialData || '', RteEditorConfig.get( this ) )
			.then( editor => {
				this.injectToolbar( editor.ui.view.toolbar.element );

				// Inject the editable in the DOM within the appropriate DOM structure around it.
				{
					// Here we mimic part of the GH dom, especially because of the classes.
					const tree = this.getEditableParentTree();

					// Inject the editor in the above tree.
					tree.querySelector( '.github-writer-ckeditor' ).append( editor.ui.getEditableElement() );

					const markdownEditor = this.githubEditor.markdownEditor;

					if ( markdownEditor.isEdit ) {
						// On edit, the GH dom is totally different. Add the editor after the preview panel.
						this.githubEditor.domManipulator.appendAfter( markdownEditor.dom.panels.preview, tree );
					} else {
						// Add the editor after the actual GH panels container, to avoid the GH panels show/hide logic to touch it.
						this.githubEditor.domManipulator.appendAfter( markdownEditor.dom.panelsContainer, tree );
					}
				}

				// Post-fix to enable the GH tooltip on the toolbar. (Items are already rendered)
				RteEditor.toolbarItemsPostfix( editor.ui.view.toolbar );

				// Expose the main objects of the API, for cross logic.
				editor.githubEditor = this.githubEditor;
				this.ckeditor = editor;

				this.githubEditor.dom.root.setAttribute( 'data-ckeditor-id', editor.id );

				// If somehow the data has been set before the creation, this is the time to load it.
				if ( this._pendingData ) {
					editor.setData( this._pendingData );
					delete this._pendingData;
				}

				// TODO: check if possible to fire Editor('ready') when everything is really ready.
				/**
				 * Fired when the whole creation logic of the editor is finished.
				 *
				 * @memberOf CKEditorGitHubEditor
				 */
				editor.fire( 'reallyReady' );
			} ) );
	}

	destroy() {
		if ( this._creationPromise ) {
			return this._creationPromise
				.then( () => {
					return this.ckeditor.destroy();
				} )
				.then( () => true );
		}

		return Promise.resolve( false );
	}

	/**
	 * Injects the CKEditor toolbar into the dom.
	 *
	 * @param {HTMLElement} toolbarElement The CKEditor toolbar element.
	 */
	injectToolbar( toolbarElement ) {
		// Inject the rte toolbar right next to the markdown editor toolbar.
		this.githubEditor.domManipulator.appendAfter( this.githubEditor.markdownEditor.dom.toolbar, toolbarElement );
	}

	/**
	 * Gets the html of the parent tree where the CKEditor editable must be placed in. The editable will be
	 * injected inside the element with class `.github-writer-ckeditor`.
	 *
	 * @returns {String} The parent tree html.
	 */
	getEditableParentTree() {
		// Mimic the minimum set of classes that are necessary for the editor, and its contents,
		// to look like GitHub originals.

		const container = document.createElement( 'div' );
		container.classList.add(
			'github-writer-panel-rte',
			'form-control', 'write-content', 'upload-enabled', 'input-contrast', 'markdown-body',
			'mx-0', 'mb-2', 'mx-md-2'
		);

		const inner = container.appendChild( document.createElement( 'div' ) );
		inner.classList.add(
			'github-writer-ckeditor',
			'comment-form-textarea', 'comment-body'
		);

		return container;
	}
}

/**
 *Fixes the toolbar buttons label so they look exactly like the original GH ones (minor detail).
 *
 * @param {ToolbarView} toolbar The toolbar to be tweaked.
 * @param  {String} tooltipPosition='n' The tooltip position: 'n' (north, top) or 's' (south, bottom).
 */
// Used by the Kebab plugin as well, so we're exporting.
RteEditor.toolbarItemsPostfix = ( toolbar, tooltipPosition = 'n' ) => {
	// Postfix is possible only in pages type "comments" (not "wiki").
	if ( App.pageManager.type !== 'comments' ) {
		return;
	}

	const ctrlCmd = env.isMac ? 'cmd' : 'ctrl';

	// The list of labels to be replaced. The keys are the default CKEditor labels.
	const labels = {
		// Not available in GH but changed to match the GH language style (more verbose).
		'Keyboard shortcut': `Add keyboard shortcut <${ ctrlCmd }+alt-k>`,
		'Strikethrough': 'Add strikethrough text',
		'Horizontal line': 'Insert a horizontal line',
		'Insert image': 'Insert an image',
		'Insert table': 'Insert a table',
		'Remove Format': 'Remove text formatting'
	};

	// Add the original labels used in GH.
	Object.entries( {
		'Bold': 'md-bold',
		'Italic': 'md-italic',
		'Block quote': 'md-quote',
		'Code': 'md-code',
		'Link': 'md-link',
		'Bulleted List': 'md-unordered-list',
		'Numbered List': 'md-ordered-list',
		'To-do List': 'md-task-list'
	} ).forEach( ( [ originalLabel, query ] ) => {
		const element = document.querySelector( query );
		const ghLabel = element && element.getAttribute( 'aria-label' );

		if ( ghLabel ) {
			labels[ originalLabel ] = ghLabel;
		}
	} );

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

			// Items inside toolbars are always rendered (item.isRendered) so we touch the DOM element for fixes.
			{
				// Make the necessary changes for the GH tooltip to work.
				// Set the text visible in the tooltip.
				item.element.setAttribute( 'aria-label', itemLabel );
				// Enable tooltips.
				item.set( 'class', ( ( item.class || '' ) + ' tooltipped tooltipped-' + tooltipPosition ).trim() );
			}
		}
	} );
};

RteEditor.cleanup = rootElement => {
	let element = rootElement.querySelector( '.github-writer-panel-rte' );
	element && element.remove();

	element = rootElement.querySelector( '.github-writer-toolbar' );
	element && element.remove();
};
