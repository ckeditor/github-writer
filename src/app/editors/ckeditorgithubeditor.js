/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import DecoupledEditor from '@ckeditor/ckeditor5-editor-decoupled/src/decouplededitor';
import GFMDataProcessor from '@ckeditor/ckeditor5-markdown-gfm/src/gfmdataprocessor';

/**
 * The CKEditor used inside the rte editor.
 */
export default class CKEditorGitHubEditor extends DecoupledEditor {
	constructor( initialData, config ) {
		super( initialData, config );

		const dp = new GFMDataProcessor( this.data.viewDocument );
		dp.keepHtml( 'kbd' );

		this.data.processor = dp;

		// Adds our very own class to the toolbar.
		this.ui.view.toolbar.extendTemplate( {
			attributes: {
				class: 'github-rte-toolbar'
			}
		} );
	}
}
