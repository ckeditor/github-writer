/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
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

import { checkDom, DomManipulator } from './util';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';

let idCounter = 0;

// Gets the proper editor classes to be used, based on the type of page we're in.
function getEditorClasses() {
	const isWiki = App.pageManager.type === 'wiki';
	return {
		MarkdownEditor: isWiki ? WikiMarkdownEditor : MarkdownEditor,
		RteEditor: isWiki ? WikiRteEditor : RteEditor
	};
}

/**
 * A GitHub Writer editor, which is a complex editor containing two switchable editing modes: RTE and Markdown.
 * It is created around a standard GitHub markdown editor, enhancing it.
 *
 * @mixes EmitterMixin
 */
export default class Editor {
	/**
	 * Creates a GitHub Writer editor.
	 *
	 * @param {HTMLElement} markdownEditorRootElement The outermost element that contains the complete dom of a single
	 * GitHub markdown editor.
	 */
	constructor( markdownEditorRootElement ) {
		this.id = ++idCounter;

		this.domManipulator = new DomManipulator();

		// This will expose the list of editors in the extension console in the dev build.
		/* istanbul ignore next */
		if ( process.env.NODE_ENV !== 'production' ) {
			( window.GITHUB_WRITER_EDITORS = window.GITHUB_WRITER_EDITORS || [] ).push( this );
			this.domManipulator.addRollbackOperation(
				() => window.GITHUB_WRITER_EDITORS.splice( window.GITHUB_WRITER_EDITORS.indexOf( this ), 1 ) );
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
			this.dom = {
				/**
				 * The outermost element encompassing the structure around the original GitHub markdown editor.
				 */
				root: markdownEditorRootElement,

				/**
				 * The container for the editor panels body (Write and Preview)
				 *
				 * This is <tab-container> on New Issue and Add Comment and <div> on Edit Comment.
				 *
				 * @type {HTMLElement}
				 * @memberOf MarkdownEditor#dom
				 */
				panelsContainer: markdownEditorRootElement.querySelector( '.previewable-comment-form' ),

				tabs: {
					/**
					 * The "Write" tab.
					 */
					write: markdownEditorRootElement.querySelector( '.write-tab' )
				},

				/**
				 * Gets the primary submit button element.
				 *
				 * This element shouldn't be cached because GH replaces it some situation, for example when data is saved.
				 *
				 * @returns {HTMLButtonElement}
				 */
				getSubmitBtn() {
					return markdownEditorRootElement.querySelector( 'input[type=submit].btn-primary, button[type=submit].btn-primary' );
				},

				/**
				 * Gets the alternative submit button element, if available.
				 *
				 * This element shouldn't be cached because GH replaces it some situation, for example when data is saved.
				 *
				 * @returns {HTMLButtonElement}
				 */
				getSubmitAlternativeBtn() {
					return markdownEditorRootElement.querySelector( '.js-quick-submit-alternative, button.js-save-draft' );
				}
			};

			checkDom( this.dom );

			this.domManipulator.addRollbackOperation( () => delete this.dom );
		}

		// Create the inner editors.
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
				this.domManipulator.addClass( markdownEditorRootElement, 'github-writer-type-wiki' );
			}
		}

		// Create the session key, used to save session data.
		this.sessionKey = 'github-writer-session:' + window.location.pathname + '?' + this.markdownEditor.dom.textarea.id;

		// Setup size (and resize).
		{
			let container = this.dom.panelsContainer;
			container = this.markdownEditor.isEdit ? container : container.parentElement;

			if ( !( this.markdownEditor instanceof WikiMarkdownEditor ) ) {
				container.classList.add( 'github-writer-size-container' );

				setupSize( this );
			}

			function setupSize( editor ) {
				// Set minimum height = current height.
				const min = container.offsetHeight;
				container.style.minHeight = min + 'px';

				// GH Stickies.
				const stickyHeader = document.querySelector( '.gh-header-sticky.js-sticky' );
				const stickyNotification = document.querySelector( '.js-notification-shelf.js-sticky' );
				const stickyPrToolbar = document.querySelector( '.pr-toolbar.js-sticky' );
				const stickyFileHeader = document.querySelector( '.js-file-header.sticky-file-header' );

				const setMaxHeight = () => {
					// Take the viewport height.
					let max = document.documentElement.clientHeight;

					// Minus GH stickies.
					{
						if ( stickyHeader ) {
							const height = stickyHeader.offsetHeight;
							height > 1 && ( max -= height );
						}
						if ( stickyNotification ) {
							max -= stickyNotification.offsetHeight;
						}
						if ( stickyFileHeader ) {
							max -= stickyFileHeader.offsetHeight;
						}
						if ( stickyPrToolbar ) {
							max -= stickyPrToolbar.offsetHeight;
						}
					}

					// Minus margin
					max -= 60;

					// Max must be at least min.
					max = Math.max( min, max );

					container.style.maxHeight = max + 'px';
				};

				setMaxHeight();

				// Observe the GH stickies show/hide.
				if ( stickyHeader || stickyNotification || stickyFileHeader ) {
					const observer = new ResizeObserver( setMaxHeight );
					editor.domManipulator.addRollbackOperation( () => observer.disconnect() );

					stickyHeader && observer.observe( stickyHeader );
					stickyNotification && observer.observe( stickyNotification );
				}

				// Observe window resize.
				editor.domManipulator.addEventListener( window, 'resize', () => {
					setMaxHeight();
				} );
			}
		}
	}

	/**
	 * The currently active in the editor.
	 *
	 * @returns {String|null} One of the {Editor.modes}.
	 */
	getMode() {
		if ( this._destroyed ) {
			return Editor.modes.DESTROYED;
		}

		// Take the mode from the dom directly.
		if ( this.dom.root.classList.contains( 'github-writer-mode-rte' ) ) {
			return Editor.modes.RTE;
		} else if ( this.dom.root.classList.contains( 'github-writer-mode-markdown' ) ) {
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

		if ( mode === Editor.modes.DESTROYED ) {
			this._destroyed = true;
		} else {
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
			this.domManipulator.toggleClass( this.dom.root, 'github-writer-mode-rte', mode === Editor.modes.RTE );
			this.domManipulator.toggleClass( this.dom.root, 'github-writer-mode-markdown', mode === Editor.modes.MARKDOWN );
		}

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
				initialData = this.markdownEditor.getData();
			}
		}

		return this.rteEditor.create( initialData )
			.then( () => {
				this._setInitialMode( initialMode );
				this._setupForm();

				// Load the editor with session data, if available.
				// This must be done after _setupForm() so the form gets locked.
				if ( sessionData && sessionData.mode === Editor.modes.RTE ) {
					this.rteEditor.ckeditor.model.data = sessionData.data;
				}

				this._setupSessionResume();
				this._setupFocus();
				this._setupEmptyCheck();
				this._setupKeystrokes();
				this._setupPendingActions();

				/* istanbul ignore next */
				if ( process.env.NODE_ENV !== 'production' ) {
					console.log( `Editor id "${ this.id }" created.`, this );
				}

				return this;
			} );
	}

	destroy() {
		let promise = Promise.resolve( false );

		if ( this.getMode() !== Editor.modes.DESTROYED ) {
			this.setMode( Editor.modes.DESTROYED );

			if ( this.rteEditor ) {
				promise = this.rteEditor.destroy()
					.then( () => {
						this.domManipulator.rollback();

						/* istanbul ignore next */
						if ( process.env.NODE_ENV !== 'production' ) {
							console.log( `Editor id "${ this.id }" destroyed.`, this );
						}
					} );
			}
		}

		return promise;
	}

	/**
	 * Copies the data from the editor of the currently active mode to the other mode editor.
	 *
	 * This operation is done when switching modes and before form post.
	 */
	syncEditors() {
		if ( this.getMode() === Editor.modes.RTE ) {
			this.markdownEditor.setData( this.rteEditor.getData() );

			// Once data reached the GH textarea, we don't need the session information anymore.
			sessionStorage.removeItem( this.sessionKey );
		} else {
			this.rteEditor.setData( this.markdownEditor.getData() );
		}

		this.fire( 'sync' );
	}

	/**
	 * Simulates the native "quote selection" feature from GitHub (the "r" key).
	 *
	 * Basically, if the RTE editor is active, execute quote-selection in it. If the markdown editor is enabled instead,
	 * do nothing and let the default behavior to happen (GH handles it).
	 *
	 * @param selectionMarkdown The markdown text to be quoted, most likely derived from the user selection.
	 */
	quoteSelection( selectionMarkdown ) {
		if ( this.getMode() === Editor.modes.RTE ) {
			this.rteEditor.ckeditor.quoteSelection( selectionMarkdown );
		}
	}

	/**
	 * Setup event listeners that save the editor data in the session storage if the user navigates away.
	 *
	 * @private
	 */
	_setupSessionResume() {
		const saveSession = () => {
			const mode = this.getMode();

			if ( mode !== Editor.modes.RTE && mode !== Editor.modes.MARKDOWN ) {
				return;
			}

			const sessionData = { mode };

			if ( this.getMode() === Editor.modes.RTE ) {
				sessionData.data = this.rteEditor.ckeditor.model.data;
			}

			sessionStorage.setItem( this.sessionKey, JSON.stringify( sessionData ) );
		};

		let isListening;

		/**
		 * Setups a listener that updates the session data for every change made in the editor.
		 */
		const setupListener = () => {
			if ( this.getMode() === Editor.modes.RTE ) {
				if ( !isListening ) {
					this.rteEditor.ckeditor.model.on( 'data', saveSession );
					isListening = true;
				}
			} else {
				this.rteEditor.ckeditor.model.off( 'data', saveSession );
				isListening = false;
			}
		};

		this.on( 'mode', () => {
			setupListener();
			saveSession();
		} );

		setupListener();
	}

	/**
	 * Setups focus related features.
	 *
	 * @private
	 */
	_setupFocus() {
		// Enable editor focus when clicking the "Write" tab.
		this.domManipulator.addEventListener( this.dom.tabs.write, 'click', () => {
			setTimeout( () => {
				if ( this.getMode() === Editor.modes.RTE ) {
					this.rteEditor.focus();
				}
			} );
		} );

		// Enable the GitHub focus styles when the editor focus/blur.
		{
			// Take the element that GH would styles on focus.
			const focusBox = this.dom.root.querySelector( '.github-writer-panel-rte' );

			// Watch for editor focus changes.
			this.rteEditor.ckeditor.ui.focusTracker.on( 'change:isFocused', ( evt, name, value ) => {
				focusBox.classList.toggle( 'focus', !!value );
			} );
		}
	}

	/**
	 * Setup empty checks in the rte editor that influence the page behavior.
	 *
	 * @private
	 */
	_setupEmptyCheck() {
		const ckeditor = this.rteEditor.ckeditor;

		// Enable/disable the submit buttons based on the editor emptiness.
		ckeditor.on( 'change:isEmpty', () => {
			this._setSubmitStatus();
			fixLabels( this );
		} );

		fixLabels( this );

		function fixLabels( editor ) {
			const page = App.pageManager.page;
			const submitAlternative = editor.dom.getSubmitAlternativeBtn();

			// This is the target element inside the button that holds the label.
			const labelElement = submitAlternative && submitAlternative.querySelector( '.js-form-action-text' );

			if ( labelElement && ( page === 'repo_issues' || page === 'repo_pulls' ) ) {
				// The when-non-empty label is saved by GH in an attribute (we add also a generic fallback, just in case).
				let label = submitAlternative.getAttribute( 'data-comment-text' ) || 'Close and comment';

				if ( ckeditor.isEmpty ) {
					// The when-empty label is kinda tricky, but the following should do the magic.
					label = label.replace( /and .+$/, page === 'repo_issues' ?
						'issue' :
						'pull request' );
				}

				labelElement.textContent = label;
			}
		}
	}

	/**
	 * Setups the form submit and reset.
	 *
	 * @private
	 */
	_setupForm() {
		const ckeditor = this.rteEditor.ckeditor;
		const textarea = this.markdownEditor.dom.textarea;
		const form = textarea.form;

		// Reset the rte editor on form reset (e.g. after a new comment is added).
		{
			this.domManipulator.addEventListener( form, 'reset', () => {
				// We actually want it 'after-reset', so form elements are clean, thus setTimeout.
				setTimeout( () => {
					this.rteEditor.setData( this.markdownEditor.dom.textarea.defaultValue );
					this._setInitialMode();

					// The above setData() locked the form and saved session data. Undo it.
					unlockForm( this );
					sessionStorage.removeItem( this.sessionKey );
				} );
			} );
		}

		// Setup listeners for submit buttons.
		{
			this.domManipulator.addEventListener( 'button[type="submit"]', 'click', ( ev, button ) => {
				if ( button.closest( 'form' ) === form ) {
					// We want to play safe here an not allow the form to be posted if there is any error in the synchronization.
					try {
						syncOnSubmit( this );
					} catch ( e ) {
						// Log the error in the console anyway, for debugging.
						console.error( e );

						// Show an error message to the user.
						showError();

						// Block the form post.
						ev.preventDefault();
						ev.stopImmediatePropagation();
					}
				}
			} );
		}

		// Events tha lock/unlock the form.
		{
			this.on( 'sync', () => {
				unlockForm();
			} );

			this.on( 'mode', () => {
				if ( this.getMode() === Editor.modes.RTE ) {
					lockForm();
				} else {
					unlockForm();
				}
			} );
		}

		listenToData();

		const that = this;

		/**
		 * Triggers the form locking as soon as a change is made to the editor data.
		 */
		function listenToData() {
			ckeditor.model.once( 'data', () => lockForm() );
		}

		/**
		 * Locks the form so GH will not be able to post it even if we're not able to intercept the form post.
		 */
		function lockForm() {
			// Safety check, just in case anything unexpected triggers the form locking.
			if ( that.getMode() !== Editor.modes.RTE ) {
				return;
			}

			// Save the "require" value so it can be restored on unlock().
			/* Just in case */ /* istanbul ignore else */
			if ( !textarea.hasAttribute( 'data-github-writer-was-required' ) ) {
				textarea.setAttribute( 'data-github-writer-was-required', textarea.required );
			}
			// This will ensure that the textarea will be checked by GH on post.
			textarea.required = true;

			// This will make the GH checks fail and the form post to stop.
			textarea.setCustomValidity( 'Something went wrong. This textarea was not sync`ed with GitHub Writer.' );

			// Force all submit buttons to validate.
			form.querySelectorAll( 'button[type="submit"][formnovalidate]' ).forEach( button => {
				// Mark for restore when unlock().
				button.setAttribute( 'data-github-writer-was-formnovalidate', 'true' );
				button.removeAttribute( 'formnovalidate' );
			} );
		}

		/**
		 * Unlocks the form, reverting the work done by lock().
		 */
		function unlockForm() {
			if ( textarea.hasAttribute( 'data-github-writer-was-required' ) ) {
				textarea.required = ( textarea.getAttribute( 'data-github-writer-was-required' ) === 'true' );
				textarea.removeAttribute( 'data-github-writer-was-required' );
			}

			textarea.setCustomValidity( '' );

			// Restore the "formnovalidate" attribute on submit buttons.
			form.querySelectorAll( 'button[type="submit"]' ).forEach( button => {
				if ( button.hasAttribute( 'data-github-writer-was-formnovalidate' ) ) {
					button.setAttribute( 'formnovalidate', '' );
					button.removeAttribute( 'data-github-writer-was-formnovalidate' );
				}
			} );

			// Start listening to data changes again.
			listenToData();
		}

		/**
		 * Sync's the editors and saves the submit time.
		 * @param editor {Editor} The editor to be sync'ed.
		 */
		function syncOnSubmit( editor ) {
			if ( editor.getMode() === Editor.modes.RTE ) {
				editor.syncEditors();
			}
		}

		/**
		 * Shows the GH native error if we were not able to sync the markdown textarea on form post.
		 *
		 * @returns {boolean}
		 */
		function showError() {
			const error = form.querySelector( '.js-comment-form-error' );

			if ( error ) {
				// The following is exactly what GH does to display the error.
				error.textContent = 'There was an error saving the form. Reload the page and try again.';
				error.hidden = false;
				error.style.display = 'block';
				error.classList.remove( 'd-none' );
			}
		}
	}

	/**
	 * Implements what GH calls "Quick Submit", and way to submit the form using (Shift+)Cmd/Ctrl+Enter.
	 *
	 * @private
	 */
	_setupKeystrokes() {
		const viewDocument = this.rteEditor.ckeditor.editing.view.document;

		viewDocument.on( 'keydown', ( eventInfo, data ) => {
			// Setup the "Quick Submit" feature. (#12)
			{
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
							const button = data.shiftKey ?
								this.dom.getSubmitAlternativeBtn() :
								this.dom.getSubmitBtn();

							button && button.click();
						}
					}
				}
			}

			// Block ctrl+shift+p, using in the default GH editor to switch to "preview". (#21)
			{
				if ( data.keyCode === 80 && data.ctrlKey && data.shiftKey ) {
					data.domEvent.preventDefault();
				}
			}
		}, { priority: 'high' } );
	}

	_setupPendingActions() {
		if ( this.rteEditor.ckeditor.plugins.has( 'PendingActions' ) ) {
			const pendingActions = this.rteEditor.ckeditor.plugins.get( 'PendingActions' );

			pendingActions.on( 'change:hasAny', () => {
				this._setSubmitStatus();
			} );
		}
	}

	/**
	 * Sets the most appropriate mode for this editor on startup.
	 *
	 * It defaults to rte but, when editing existing data, it may happen that the markdown to be loaded is not
	 * compatible with the rte editor. In such case, start on markdown mode and let it to the user to decide whether
	 * to move to rte or not by using the ui.
	 *
	 * @param [initialMode] {Boolean} The mode forced to be set.
	 *
	 * @private
	 */
	_setInitialMode( initialMode ) {
		initialMode = initialMode || ( this._checkDataLoss() ? Editor.modes.MARKDOWN : Editor.modes.RTE );

		this.setMode( initialMode, { noSynch: true, noCheck: true } );

		// The submit status must always be updated when setting the initial mode.
		this._setSubmitStatus();
	}

	/**
	 * Set the disabled status of the Submit buttons based on a series of checks.
	 *
	 * @private
	 */
	_setSubmitStatus() {
		// We do this job in RTE mode only. In Markdown, GH takes care of it.
		if ( this.getMode() !== Editor.modes.RTE ) {
			return;
		}

		const ckeditor = this.rteEditor.ckeditor;

		// In wiki pages, the button is always on no matter the value of required fields.
		const isWiki = ( App.pageManager.page === 'repo_wiki' );

		// Default behavior.
		let disabled = false;

		// It must be for sure disabled if there are pending actions in the editor (upload in progress).
		if ( ckeditor.plugins.has( 'PendingActions' ) && ckeditor.plugins.get( 'PendingActions' ).hasAny ) {
			disabled = true;
		} else {
			// Otherwise, we check the validity of the required form elements.

			const textarea = this.markdownEditor.dom.textarea;
			const form = textarea.form;

			disabled = Array.from( form.querySelectorAll( '[required]' ) ).some( element => {
				// Instead of checking the markdown textarea, we check the RTE editor.
				if ( element === textarea ) {
					// We may have changed the "required" attribute of the textarea. We want the original value.
					const required = textarea.getAttribute( 'data-github-writer-was-required' ) !== 'false';

					return required && ckeditor.isEmpty;
				} else if ( !isWiki ) {
					// For other elements, we just use DOM checks.
					return !element.checkValidity();
				}
			} );
		}

		// As we'll be setting the "disabled" attribute, we pause the mutation observer.
		disconnectSubmitButtonObserver.call( this );

		// Finally set the "disabled" property on all submit buttons.
		{
			// GH marks submit buttons that are sensitive to form validation with [data-disable-invalid].
			this.dom.root.querySelectorAll( 'button[type="submit"][data-disable-invalid]' )
				.forEach( button => ( button.disabled = disabled ) );
		}

		// Re-wire the mutation observer. In this way, we'll know when external code (GH) wants to change the "disabled"
		// attribute of the submit button so we replace that change with our custom check.
		connectSubmitButtonObserver.call( this );

		function connectSubmitButtonObserver() {
			this._submitButtonObserver = new MutationObserver( () => {
				// noinspection JSPotentiallyInvalidUsageOfClassThis
				this._setSubmitStatus();
			} );

			// GH messes up with submit buttons as its will, so instead of observe a specific button, we observe
			// anything in the form that had the "disabled" attributed changed (usually submit buttons).
			this._submitButtonObserver.observe( this.dom.root, {
				attributes: true,
				attributeFilter: [ 'disabled' ],
				subtree: true
			} );

			if ( !this.domManipulator._hasSubmitBtnObRollback ) {
				this.domManipulator.addRollbackOperation( () => disconnectSubmitButtonObserver.call( this ) );
				this.domManipulator._hasSubmitBtnObRollback = true;
			}
		}

		function disconnectSubmitButtonObserver() {
			if ( this._submitButtonObserver ) {
				this._submitButtonObserver.disconnect();
				delete this._submitButtonObserver;
			}
		}
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

	static cleanup( rootElement ) {
		rootElement.classList.remove( 'github-writer-mode-rte' );
		rootElement.classList.remove( 'github-writer-mode-markdown' );
		RteEditor.cleanup( rootElement );
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
	DESTROYED: 'destroyed',
	UNKNOWN: null
};
