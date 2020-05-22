/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import editorModes from './modes';
const { RTE } = editorModes;

const DataMixin = {
	/**
	 * Gets the data currently available in the editor.
	 *
	 * @returns {String} The data in markdown format.
	 */
	getData() {
		if ( this.getMode() === RTE ) {
			return this.getCKEditorData();
		} else {
			return this.dom.textarea.value;
		}
	},

	getCKEditorData() {
		if ( this.ckeditor ) {
			return this.ckeditor.getData()
				// Replace nbsp around emojis. (#181)
				.replace( /(?:([^ ])\u00A0(?=:[^ ]))|(?:([^ ]:)\u00A0(?! ))/g, '$1$2 ' );
		}
		return this._pendingData || '';
	},

	/**
	 * Sets the editor data.
	 *
	 * @param {String} data The new data to be set, in markdown format.
	 */
	setData( data ) {
		if ( this.getMode() === RTE ) {
			this.setCKEditorData( data );
		} else {
			this.dom.textarea.value = data;
		}
	},

	setCKEditorData( data ) {
		if ( this.ckeditor ) {
			this.ckeditor.setData( data );
		} else {
			this._pendingData = data;
		}
	},

	/**
	 * Copies the data from the editor of the currently active mode to the other mode editor.
	 *
	 * This operation is done when switching modes and before form post.
	 */
	syncData() {
		if ( this.getMode() === RTE ) {
			this.dom.textarea.value = this.getData();

			// Once data reached the GH textarea, we don't need the session information anymore.
			sessionStorage.removeItem( this.sessionKey );
		} else {
			this.setCKEditorData( this.getData() );
		}

		this.fire( 'sync' );
	},

	/**
	 * Checks if the data present in the rte editor may indicate a potential for data loss when compared
	 * to the data in the markdown editor.
	 */
	checkDataLoss() {
		// The trick is very simple. Both editors produce markdown, so we check if the one produced
		// with the rte editor is semantically similar to the one in the markdown editor.

		const rteData = this.getCKEditorData();
		const markdownData = this.dom.textarea.value;

		return stripSpaces( rteData ) !== stripSpaces( markdownData );

		function stripSpaces( text ) {
			return text.replace( /\s/g, '' );
		}
	}
};

export default DataMixin;
