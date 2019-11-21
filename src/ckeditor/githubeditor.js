/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import DecoupledEditor from '@ckeditor/ckeditor5-editor-decoupled/src/decouplededitor';
import GFMDataProcessor from '@ckeditor/ckeditor5-markdown-gfm/src/gfmdataprocessor';

import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Autoformat from './autoformat';

import Heading from '@ckeditor/ckeditor5-heading/src/heading';

import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Code from '@ckeditor/ckeditor5-basic-styles/src/code';
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';

import BlockQuoteEditing from '@ckeditor/ckeditor5-block-quote/src/blockquoteediting';

import List from '@ckeditor/ckeditor5-list/src/list';
import TodoList from '@ckeditor/ckeditor5-list/src/todolist';

import Image from '@ckeditor/ckeditor5-image/src/image';
import ImageUpload from '@ckeditor/ckeditor5-image/src/imageupload';
import GitHubUploadAdapter from './githubuploadadapter';

import Mention from '@ckeditor/ckeditor5-mention/src/mention';

import './theme/githubeditor.css';

// TODO: For now DecoupledEditor we're simply inheriting from the DecoupledEditor. Maybe creating an Editor from
//  scratch makes more sense? Performance?

export default class GitHubEditor extends DecoupledEditor {
	constructor( initialData, extraConfig ) {
		super( initialData, Object.assign({
			plugins: [
				Essentials, Paragraph, Autoformat, Mention,
				Image, ImageUpload, GitHubUploadAdapter,
				Heading,
				Bold, Italic, Code, Strikethrough,
				BlockQuoteEditing,
				List, TodoList
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
		}, extraConfig ) );

		this.data.processor = new GFMDataProcessor();
	}
}
