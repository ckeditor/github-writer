/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import DecoupledEditor from '@ckeditor/ckeditor5-editor-decoupled/src/decouplededitor';

import GFMDataProcessor from '@ckeditor/ckeditor5-markdown-gfm/src/gfmdataprocessor';

import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';

// TODO: For now DecoupledEditor we're simply inheriting from the DecoupledEditor. Maybe creating an Editor from
//  scratch makes more sense? Performance?

export default class GitHubEditor extends DecoupledEditor {
	constructor( initialData ) {
		super( initialData, {
			plugins: [
				Essentials, Paragraph,
				Bold, Italic
			],
			placeholder: 'Leave a comment'
		} );

		this.data.processor = new GFMDataProcessor();
	}
}
