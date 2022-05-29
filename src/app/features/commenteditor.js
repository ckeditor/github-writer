/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../editor/editor';
import { addClickListener } from '../modules/util';

export default class CommentEditor extends Editor {
	get type() {
		return 'CommentEditor';
	}

	injectEditable( editable ) {
		const container = this.createEditableContainer( editable );

		// On edit, the GH dom is totally different. Add the editor after the preview panel.
		this.domManipulator.appendAfter( this.dom.panels.preview, container );
	}

	static run() {
		// Edit option for comments: listen to "comment action" buttons and create the editor.
		addClickListener( '.timeline-comment-action', actionsButton => {
			let editButton = actionsButton.closest( 'details' );
			editButton = editButton && editButton.querySelector( '.js-comment-edit-button' );

			if ( editButton ) {
				const rootElement = editButton.closest( '.js-comment' ).querySelector( 'form.js-comment-update' );
				this.createEditor( rootElement, true );
			}
		} );

		const promises = [];

		// Setup comment editors that are visible to the user (e.g. PR pages between pjax requests).
		{
			const selector = '.inline-comment-form-container.open form.js-inline-comment-form,' +
				'.is-comment-editing form.js-comment-update';

			document.querySelectorAll( selector ).forEach( root => {
				promises.push( this.createEditor( root ) );
			} );
		}

		return Promise.all( promises );
	}
}
