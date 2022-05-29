/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../editor/editor';
import { addClickListener } from '../modules/util';

export default class NewInlineCommentEditor extends Editor {
	get type() {
		return 'NewInlineCommentEditor';
	}

	getSizeContainer() {
		return this.dom.root;
	}

	static run() {
		// Edit option for comments: listen to "comment action" buttons and create the editor.
		addClickListener( '.js-toggle-inline-comment-form', button => {
			const container = button.closest( '.js-inline-comment-form-container' );
			const root = container && container.querySelector( 'form' );
			root && this.createEditor( root );
		} );
	}
}
