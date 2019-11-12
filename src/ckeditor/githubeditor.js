/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import DecoupledEditor from '@ckeditor/ckeditor5-editor-decoupled/src/decouplededitor';

import GFMDataProcessor from '@ckeditor/ckeditor5-markdown-gfm/src/gfmdataprocessor';

import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';

import Heading from '@ckeditor/ckeditor5-heading/src/heading';

import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';

// TODO: For now DecoupledEditor we're simply inheriting from the DecoupledEditor. Maybe creating an Editor from
//  scratch makes more sense? Performance?

export default class GitHubEditor extends DecoupledEditor {
	constructor( initialData ) {
		super( initialData, {
			plugins: [
				Essentials, Paragraph,
				Heading,
				Bold, Italic
			],
			placeholder: 'Leave a comment',
			heading: {
				options: [
					{ model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
					{ model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
					{ model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
					{ model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
					{ model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
					{ model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
					{ model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
				]
			}

		} );

		this.data.processor = new GFMDataProcessor();
	}
}
