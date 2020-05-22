/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../editor/editor';

export default class WikiEditor extends Editor {
	constructor( root ) {
		super( root );

		this.placeholder = null;
	}

	getDom( root ) {
		const dom = super.getDom( root );

		dom.toolbarContainer = root.querySelector( '.comment-form-head' );
		dom.panels.markdown = root.querySelector( '.previewable-comment-form > .write-content' );

		delete dom.toolbar;

		return dom;
	}

	getSizeContainer() {
		// Disable auto-resize as we have "grow forever" enabled in wikis.
		return null;
	}

	getCKEditorConfig() {
		const config = super.getCKEditorConfig();

		// Wiki pages support autolinking on urls only.
		config.githubWriter && ( config.githubWriter.autoLinking = { url: true } );

		return config;
	}

	injectToolbar( toolbarElement ) {
		// Inject the rte toolbar at the end of the toolbar container.
		this.domManipulator.append( this.dom.toolbarContainer, toolbarElement );
	}

	createEditableContainer( editable ) {
		// Mimic the minimum set of classes that are necessary for the editor, and its contents,
		// to look like GitHub originals.

		const container = document.createElement( 'div' );
		container.classList.add(
			'github-writer-panel-rte',
			'form-control', 'mt-3'
		);

		const inner = container.appendChild( document.createElement( 'div' ) );
		inner.classList.add(
			'github-writer-ckeditor',
			'upload-enabled', 'markdown-body'
		);

		inner.append( editable );

		return container;
	}

	static run() {
		return this.createEditor( 'form[name="gollum-editor"]' );
	}
}
