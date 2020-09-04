/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../editor/editor';

let listening = false;

export default class CodeLineCommentEditor extends Editor {
	get type() {
		return 'CodeLineCommentEditor';
	}

	static run() {
		if ( !listening ) {
			// Code line comments: the "+" button...fires an event when the form for code comments is injected.
			document.addEventListener( 'inlinecomment:focus', ev => {
				const root = ev.target.querySelector( 'form' );
				root && this.createEditor( root ).then( editor => editor.dom.tabs.write.click() );
			} );
		}
		listening = true;
	}
}
