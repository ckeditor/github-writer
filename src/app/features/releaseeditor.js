/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../editor/editor';

export default class ReleaseEditor extends Editor {
	injectToolbar( toolbarElement ) {
		const tabs = this.dom.root.querySelector( 'nav.tabnav-tabs' );

		if ( tabs ) {
			tabs.after( toolbarElement );
		}
	}

	injectEditable( editable ) {
		const container = this.createEditableContainer( editable );
		container.classList.remove( 'mx-md-2' );

		this.domManipulator.appendAfter( this.dom.panels.preview, container );
	}

	static run() {
		return this.createEditor( 'form.js-release-form' );
	}
}
