/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import App from '../app';

import editorModes from './modes';
const { RTE } = editorModes;

/**
 * @mixin
 */
const SubmitStatusMixin = {
	/**
	 * Set the disabled status of the Submit buttons based on a series of checks.
	 *
	 * @private
	 */
	_setSubmitStatus() {
		// We do this job in RTE mode only. In Markdown, GH takes care of it.
		if ( this.getMode() !== RTE ) {
			return;
		}

		const ckeditor = this.ckeditor;

		// In wiki pages, the button is always on no matter the value of required fields.
		const isWiki = ( App.page.name === 'repo_wiki' );

		// Default behavior.
		let disabled = false;

		// It must be for sure disabled if there are pending actions in the editor (upload in progress).
		if ( ckeditor.plugins.has( 'PendingActions' ) && ckeditor.plugins.get( 'PendingActions' ).hasAny ) {
			disabled = true;
		} else {
			// Otherwise, we check the validity of the required form elements.

			const textarea = this.dom.textarea;
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
			const selectors =
				// GH marks submit buttons that are sensitive to form validation with [data-disable-invalid].
				'button[type="submit"][data-disable-invalid],' +
				// Except the code editor.
				'button[type="submit"].btn-primary.js-blob-submit';

			this.dom.root.querySelectorAll( selectors )
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
};

export default SubmitStatusMixin;
