/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global process */

import CKEditorGitHubEditor from './ckeditorgithubeditor';
import CKEditorConfig from './ckeditorconfig';
import utils from './utils';

import editorModes from './modes';
import { blockPjaxClicks } from '../modules/util';

const { RTE, DESTROYED } = editorModes;

// The list of created editor promises. The key in this list is the root element.
const editors = new WeakMap();

/**
 * @mixin
 */
const CreateEditorStaticMixin = {
	MAX_TIMEOUT: 500,

	/**
	 * Creates an editor around the GitHub markdown editor enclosed by the given dom element.
	 *
	 * @param {HTMLElement|String} root The outermost DOM element (or its CSS selector) that contains
	 * the whole structure around a GitHub markdown editor.
	 * @param {Boolean} [withTimeout] If the setup should happen with timeout, hopefully in the next
	 * available idle loop of the browser.
	 * @returns {Promise<Editor>} A promise that resolves to the editor created once its CKEditor
	 * instance is created and ready.
	 */
	createEditor( root, withTimeout ) {
		if ( withTimeout ) {
			return new Promise( resolve => {
				if ( window.requestIdleCallback ) {
					window.requestIdleCallback( () => resolve( this.createEditor( root ) ), { timeout: this.MAX_TIMEOUT } );
				} else {
					setTimeout( () => resolve( this.createEditor( root ) ), 1 );
				}
			} );
		}

		if ( typeof root === 'string' ) {
			root = document.querySelector( root );

			if ( !root ) {
				return Promise.resolve( false );
			}
		}

		let editorCreatePromise = editors.get( root );

		if ( editorCreatePromise ) {
			return editorCreatePromise;
		}

		let editor;

		try {
			// Check if we're in a dirty dom.
			{
				const existingId = root.getAttribute( 'data-github-writer-id' );
				if ( existingId ) {
					// This is most likely a clone from a previous existing editor, landing into a pjax snapshot.
					// Clean it up so a new editor can be started on it.
					this.cleanup( root );

					// Ensure that things here are also clean (all references to this editor are dead).
					editors.delete( existingId );
					delete editors[ existingId ];
				}
			}

			editor = new this( root );
		} catch ( error ) {
			return Promise.reject( error );
		}

		editorCreatePromise = editor.create();

		return editorCreatePromise;
	},

	addEditor( editor, editorCreatePromise ) {
		// Save a reference to the root element, so we don't create editors for it again.
		editors.set( editor.dom.root, editorCreatePromise );

		// Save also an id reference, this time to the editor itself.
		editors[ editor.id ] = editor;
	},

	/**
	 * Checks if there is an existing editor instance for the given root element.
	 *
	 * @param root {HTMLElement} The root element.
	 */
	hasEditor( root ) {
		return editors.has( root );
	},

	destroyEditors( container ) {
		const promises = [];
		container.querySelectorAll( '[data-github-writer-id]' ).forEach( rootElement => {
			const editorPromise = editors.get( rootElement );
			if ( editorPromise ) {
				promises.push( editorPromise.then( editor => editor.destroy() ) );
			}
			editors.delete( rootElement );
		} );

		return Promise.all( promises );
	},

	cleanup( rootElement ) {
		rootElement.classList.remove( 'github-writer-mode-rte' );
		rootElement.classList.remove( 'github-writer-mode-markdown' );

		let element = rootElement.querySelector( '.github-writer-panel-rte' );
		element && element.remove();

		element = rootElement.querySelector( '.github-writer-toolbar' );
		element && element.remove();
	}
};

/**
 * @mixin
 */
const CreateEditorInstanceMixin = {
	create() {
		if ( this._creationPromise ) {
			return this._creationPromise;
		}

		/* istanbul ignore next */
		if ( process.env.NODE_ENV !== 'production' ) {
			console.time( `Editor id "${ this.id }" created` );
		}

		let sessionData, initialMode, initialData;

		// Retrieve the initial mode and data.
		{
			// Try to get it from session storage.
			sessionData = sessionStorage.getItem( this.sessionKey );

			if ( sessionData ) {
				sessionData = JSON.parse( sessionData );

				initialMode = sessionData.mode;
				initialData = '';
			} else {
				// Otherwise, the initial data is a copy of the markdown editor data.
				initialData = this.dom.textarea.value;
			}
		}

		const promise = this._creationPromise = this._createCKEditor( initialData ).then( () => {
			this._setInitialMode( initialMode );
			this._setupForm();

			// Load the editor with session data, if available.
			// This must be done after _setupForm() so the form gets locked.
			if ( sessionData && sessionData.mode === RTE ) {
				this.ckeditor.model.data = sessionData.data;
			}

			this._setupSessionResume();
			this._setupFocus();
			this._setupEmptyCheck();
			this._setupKeystrokes();
			this._setupPendingActions();

			/* istanbul ignore next */
			if ( process.env.NODE_ENV !== 'production' ) {
				console.timeEnd( `Editor id "${ this.id }" created` );
				console.log( this );
			}

			return this;
		} );

		// Save it into the editor list.
		this.constructor.addEditor( this, promise );

		return promise;
	},

	destroy() {
		let promise = Promise.resolve( false );

		if ( this.getMode() !== DESTROYED ) {
			this.setMode( DESTROYED );

			if ( this._creationPromise ) {
				promise = this._creationPromise
					.then( () => {
						return this.ckeditor.destroy();
					} )
					.then( () => true );
			}

			promise = promise.then( returnValue => {
				this.domManipulator.rollback();

				/* istanbul ignore next */
				if ( process.env.NODE_ENV !== 'production' ) {
					console.log( `Editor id "${ this.id }" destroyed.`, this );
				}

				return returnValue;
			} );
		}

		return promise;
	},

	/**
	 * Injects the CKEditor toolbar into the dom.
	 *
	 * @param {HTMLElement} toolbarElement The CKEditor toolbar element.
	 * @protected
	 */
	injectToolbar( toolbarElement ) {
		// Inject the rte toolbar right next to the markdown editor toolbar.
		this.domManipulator.appendAfter( this.dom.toolbar, toolbarElement );
	},

	/**
	 *
	 * @param editable
	 * @protected
	 */
	injectEditable( editable ) {
		const container = this.createEditableContainer( editable );

		// Add the editor after the actual GH panels container, to avoid the GH panels show/hide logic to touch it.
		this.domManipulator.appendAfter( this.dom.panelsContainer, container );
	},

	/**
	 * Gets the html of the parent tree where the CKEditor editable must be placed in. The editable will be
	 * injected inside the element with class `.github-writer-ckeditor`.
	 *
	 * @returns {String} The parent tree html.
	 * @protected
	 */
	createEditableContainer( editable ) {
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

		inner.append( editable );

		return container;
	},

	/**
	 * @return {{}}
	 * @protected
	 */
	getCKEditorConfig() {
		return CKEditorConfig.get( this );
	},

	/**
	 * @param initialData {string}
	 * @return {Promise<CKEditorGitHubEditor>}
	 * @private
	 */
	_createCKEditor( initialData ) {
		// Returns the promise that follows the creation of the internal CKEditor instance.
		return CKEditorGitHubEditor.create( initialData || '', this.getCKEditorConfig() )
			.then( editor => {
				const editable = editor.ui.getEditableElement();

				this.injectToolbar( editor.ui.view.toolbar.element );
				this.injectEditable( editable );

				// Block pjax loading when clicking links inside the editor. (#189)
				blockPjaxClicks( editable );

				// Post-fix to enable the GH tooltip on the toolbar. (Items are already rendered)
				utils.toolbarItemsPostfix( editor.ui.view.toolbar );

				// Expose the main objects of the API, for cross logic.
				editor.githubEditor = this;
				this.ckeditor = editor;

				this.dom.root.setAttribute( 'data-ckeditor-id', editor.id );

				// If somehow the data has been set before the creation, this is the time to load it.
				if ( this._pendingData ) {
					editor.setData( this._pendingData );
					delete this._pendingData;
				}

				/**
				 * Fired when the whole creation logic of the editor is finished.
				 *
				 * @memberOf CKEditorGitHubEditor
				 */
				editor.fire( 'reallyReady' );
			} );
	}
};

export { CreateEditorStaticMixin, CreateEditorInstanceMixin };
