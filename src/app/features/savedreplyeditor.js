/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../editor/editor';

export default class SavedReplyEditor extends Editor {
	static run() {
		return this.createEditor( 'form.new_saved_reply, form.edit_saved_reply' );
	}
}
