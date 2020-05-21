/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import editorModes from './modes';

const { RTE, MARKDOWN, DESTROYED, UNKNOWN } = editorModes;

const ModeMixin = {
	/**
	 * The currently active in the editor.
	 *
	 * @returns {String|null} One of the {Editor.modes}.
	 */
	getMode() {
		if ( this._destroyed ) {
			return DESTROYED;
		}

		// Take the mode from the dom directly.
		if ( this.dom.root.classList.contains( 'github-writer-mode-rte' ) ) {
			return RTE;
		} else if ( this.dom.root.classList.contains( 'github-writer-mode-markdown' ) ) {
			return MARKDOWN;
		}
		return UNKNOWN;
	},

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

		if ( mode === DESTROYED ) {
			this._destroyed = true;
		} else {
			if ( !options.noSynch ) {
				this.syncData();
			}

			// If moving markdown -> rte.
			if ( !options.noCheck && currentMode === MARKDOWN && mode === RTE ) {
				if ( this.checkDataLoss() ) {
					// eslint-disable-next-line no-alert
					if ( !confirm( `This markdown contains markup that may not be compatible with the rich-text editor and may be lost.\n` +
						`\n` +
						`Do you confirm you want to switch to rich-text?` ) ) {
						return;
					}
				}
			}

			// Ensure that we have the write tab active otherwise the preview may still be visible.
			if ( currentMode !== UNKNOWN ) {
				this.dom.tabs && this.dom.tabs.write && this.dom.tabs.write.click();
			}

			// Set the appropriate class to the root element according to the mode being set.
			this.domManipulator.toggleClass( this.dom.root, 'github-writer-mode-rte', mode === RTE );
			this.domManipulator.toggleClass( this.dom.root, 'github-writer-mode-markdown', mode === MARKDOWN );

			// Fix the textarea height to adjust to it's size (GH logic).
			if ( mode === MARKDOWN ) {
				this.dom.textarea.dispatchEvent( new Event( 'change' ) );
			}
		}

		/**
		 * Fired after a new mode has been activated in the editor.
		 *
		 * @event Editor#mode
		 */
		this.fire( 'mode' );
	},

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
		initialMode = initialMode || ( this.checkDataLoss() ? MARKDOWN : RTE );

		this.setMode( initialMode, { noSynch: true, noCheck: true } );

		// The submit status must always be updated when setting the initial mode.
		this._setSubmitStatus();
	}
};

export default ModeMixin;

