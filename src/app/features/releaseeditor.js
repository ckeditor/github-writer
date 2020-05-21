/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../editor/editor';

export default class ReleaseEditor extends Editor {
	getDom( root ) {
		const dom = super.getDom( root );
		delete dom.toolbar;
		return dom;
	}

	injectToolbar( toolbarElement ) {
		const tabs = this.dom.root.querySelector( 'nav.tabnav-tabs' );

		if ( tabs ) {
			this.domManipulator.appendAfter( tabs, toolbarElement );
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
