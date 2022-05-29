/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../editor/editor';

export default class SavedReplyEditor extends Editor {
	get type() {
		return 'SavedReplyEditor';
	}

	static run() {
		return this.createEditor( 'form.new_saved_reply, form.edit_saved_reply' );
	}
}
