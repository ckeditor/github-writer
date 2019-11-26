/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Autoformat from '../plugins/autoformat';

import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import SmartCode from '../plugins/smartcode';
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';

import HeadingSwitch from '../plugins/headingswitch';

import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote';

import List from '@ckeditor/ckeditor5-list/src/list';
import TodoList from '@ckeditor/ckeditor5-list/src/todolist';

import Link from '@ckeditor/ckeditor5-link/src/link';

import Image from '@ckeditor/ckeditor5-image/src/image';
import ImageUpload from '@ckeditor/ckeditor5-image/src/imageupload';
import GitHubUploadAdapter from '../uploadadapter';

import HorizontalLine from '@ckeditor/ckeditor5-horizontal-line/src/horizontalline';

import Mention from '@ckeditor/ckeditor5-mention/src/mention';
import getMentionFeedsConfig from '../mentionfeeds';

import Kebab from '../plugins/kebab';
import ModeSwitcher from '../plugins/modeswitcher';

export default function getRteEditorConfig( rteEditor ) {
	return {
		plugins: [
			Essentials, Paragraph, Autoformat, Mention,
			Image, ImageUpload, GitHubUploadAdapter,
			HeadingSwitch,
			Bold, Italic, SmartCode, Strikethrough,
			BlockQuote,
			Link,
			List, TodoList,
			HorizontalLine,
			Kebab, ModeSwitcher
		],
		toolbar: [
			'headingswitch', 'bold', 'italic', '|',
			'blockquote', 'smartcode', 'link', '|',
			'bulletedlist', 'numberedlist', 'todolist', 'kebab'
		],
		kebabToolbar: [
			'strikethrough', 'horizontalLine', 'mode'
		],
		placeholder: 'Leave a comment',
		heading: {
			// TODO: Check the class names here.
			options: [
				{ model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
				{ model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
				{ model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
				{ model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
				{ model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
				{ model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
				{ model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
			]
		},
		mention: {
			feeds: getMentionConfig()
		},
		githubRte: {
			upload: getUploadConfig()
		}
	};

	function getUploadConfig() {
		// The element holding upload related data.
		const uploadData = rteEditor.githubEditor.markdownEditor.dom.textarea.closest( '*[data-upload-policy-url]' );

		return {
			url: uploadData.getAttribute( 'data-upload-policy-url' ),
			form: {
				authenticity_token: uploadData.getAttribute( 'data-upload-policy-authenticity-token' ),
				repository_id: uploadData.getAttribute( 'data-upload-repository-id' )
			}
		};
	}

	function getMentionConfig() {
		// Get the GH DOM element that holds the urls from which retrieve mentions.
		const textExpanderElement = rteEditor.githubEditor.markdownEditor.dom.textarea.closest( 'text-expander' );

		return getMentionFeedsConfig( {
			issues: textExpanderElement.getAttribute( 'data-issue-url' ),
			people: textExpanderElement.getAttribute( 'data-mention-url' ),
			emoji: textExpanderElement.getAttribute( 'data-emoji-url' )
		} );
	}
}
