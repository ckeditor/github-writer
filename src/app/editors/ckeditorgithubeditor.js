/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import DecoupledEditor from '@ckeditor/ckeditor5-editor-decoupled/src/decouplededitor';
import GFMDataProcessor from '@ckeditor/ckeditor5-markdown-gfm/src/gfmdataprocessor';
import CKEditorInspector from '@ckeditor/ckeditor5-inspector';
import AttributeElement from '@ckeditor/ckeditor5-engine/src/view/attributeelement';

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
				class: 'github-writer-toolbar'
			}
		} );

		// Fix the priority of the code element so it'll not contain other inline styles.
		// This is basically a copy of the original code in codeediting.js.
		// TODO: Move this to the Markdown plugin, as this is a requirement there.
		this.conversion.attributeToElement( {
			model: 'code',
			view: { name: 'code', priority: AttributeElement.DEFAULT_PRIORITY + 1 },
			upcastAlso: {
				styles: {
					'word-wrap': 'break-word'
				}
			},
			converterPriority: 'high'
		} );
	}

	inspect() {
		CKEditorInspector.attach( this );
	}
}
