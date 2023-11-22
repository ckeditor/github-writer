/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import App from '../app';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';

import editorModes from './modes';
const { RTE, MARKDOWN } = editorModes;

/**
 * @mixin
 */
const SetupMixin = {
	/**
	 * Setup event listeners that save the editor data in the session storage if the user navigates away.
	 *
	 * @private
	 */
	_setupSessionResume() {
		const saveSession = () => {
			const mode = this.getMode();

			if ( mode !== RTE && mode !== MARKDOWN ) {
				return;
			}

			const sessionData = { mode };

			if ( this.getMode() === RTE ) {
				sessionData.data = this.ckeditor.model.data;
			}

			sessionStorage.setItem( this.sessionKey, JSON.stringify( sessionData ) );
		};

		let isListening;

		/**
		 * Setups a listener that updates the session data for every change made in the editor.
		 */
		const setupListener = () => {
			if ( this.getMode() === RTE ) {
				if ( !isListening ) {
					this.ckeditor.model.on( 'data', saveSession );
					isListening = true;
				}
			} else {
				this.ckeditor.model.off( 'data', saveSession );
				isListening = false;
			}
		};

		this.on( 'mode', () => {
			setupListener();
			saveSession();
		} );

		setupListener();
	},

	/**
	 * Setups focus related features.
	 *
	 * @private
	 */
	_setupFocus() {
		// Enable editor focus when clicking the "Write" tab.
		if ( this.dom.tabs && this.dom.tabs.write ) {
			this.domManipulator.addEventListener( this.dom.tabs.write, 'click', () => {
				setTimeout( () => {
					if ( this.getMode() === RTE ) {
						this.ckeditor && this.ckeditor.focus();
					}
				} );
			} );
		}

		// Enable the GitHub focus styles when the editor focus/blur.
		{
			// Take the element that GH would styles on focus.
			const focusBox = this.dom.root.querySelector( '.github-writer-panel-rte' );

			// Watch for editor focus changes.
			this.ckeditor.ui.focusTracker.on( 'change:isFocused', ( evt, name, value ) => {
				focusBox.classList.toggle( 'focus', !!value );
			} );
		}
	},

	/**
	 * Setup empty checks in the rte editor that influence the page behavior.
	 *
	 * @private
	 */
	_setupEmptyCheck() {
		const ckeditor = this.ckeditor;

		// Enable/disable the submit buttons based on the editor emptiness.
		ckeditor.on( 'change:isEmpty', () => {
			this._setSubmitStatus();
			fixLabels( this );
		} );

		fixLabels( this );

		function fixLabels( editor ) {
			const page = App.page.name;
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
	},

	/**
	 * Setups the form submit and reset.
	 *
	 * @private
	 */
	_setupForm() {
		const ckeditor = this.ckeditor;
		const textarea = this.dom.textarea;
		const form = textarea.form;

		// Reset the rte editor on form reset (e.g. after a new comment is added).
		{
			this.domManipulator.addEventListener( form, 'reset', () => {
				if ( this.ckeditor.plugins.has( 'PendingActions' ) ) {
					const pendingActions = ckeditor.plugins.get( 'PendingActions' );

					// Remove submit pending action to undisable actual submit button
					if ( pendingActions.hasAny ) {
						pendingActions.fire( 'change:removeAction', 'submit' );
					}
				}
				// We actually want it 'after-reset', so form elements are clean, thus setTimeout.
				setTimeout( () => {
					this.setCKEditorData( this.dom.textarea.defaultValue );
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
				if ( ( button.closest( 'form' ) === form ) || button.form === form ) {
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

					if ( this.ckeditor.plugins.has( 'PendingActions' ) ) {
						const pendingActions = ckeditor.plugins.get( 'PendingActions' );

						// Add submit pending action to disable actual submit button for preventing possibility
						// clicking on that more than one time.
						if ( !this.ckeditor.plugins.get( 'PendingActions' ).hasAny ) {
							setTimeout( () => {
								pendingActions.fire( 'change:addAction', 'submit' );
							} );
						}
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
				if ( this.getMode() === RTE ) {
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
			if ( that.getMode() !== RTE ) {
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
			if ( editor.getMode() === RTE ) {
				editor.syncData();
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
	},

	/**
	 * Implements what GH calls "Quick Submit", and way to submit the form using (Shift+)Cmd/Ctrl+Enter.
	 *
	 * @private
	 */
	_setupKeystrokes() {
		const viewDocument = this.ckeditor.editing.view.document;

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
						// 	this.dom.textarea.dispatchEvent( keyEvent );
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
	},

	_setupPendingActions() {
		if ( this.ckeditor.plugins.has( 'PendingActions' ) ) {
			const pendingActions = this.ckeditor.plugins.get( 'PendingActions' );
			const actions = new Map();

			pendingActions.on( 'change:hasAny', () => {
				this._setSubmitStatus();
			} );

			// Add to PendingActions collection new action.
			pendingActions.on( 'change:addAction', ( _, name ) => {
				const action = pendingActions.add( name );

				actions.set( name, action );
			} );

			// Remove action from PendingActions collection.
			pendingActions.on( 'change:removeAction', ( _, name ) => {
				const action = actions.get( name );

				if ( action ) {
					pendingActions.remove( action );
					actions.delete( name );
				}
			} );
		}
	}
};

export default SetupMixin;
