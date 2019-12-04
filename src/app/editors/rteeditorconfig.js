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
import GitHubUploadAdapter from '../plugins/uploadadapter';

import HorizontalLine from '@ckeditor/ckeditor5-horizontal-line/src/horizontalline';

import Table from '@ckeditor/ckeditor5-table/src/table';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';

import Mention from '@ckeditor/ckeditor5-mention/src/mention';
import getMentionFeedsConfig from '../mentionfeeds';

import Kebab from '../plugins/kebab';
import RemoveFormat from '@ckeditor/ckeditor5-remove-format/src/removeformat';
import ModeSwitcher from '../plugins/modeswitcher';

import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import QuoteSelection from '../plugins/quoteselection';
import ResetListener from '../plugins/resetlistener';

import App from '../app';
import { getNewIssuePageDom } from '../util';

export default function getRteEditorConfig( rteEditor ) {
	const isCommentsPage = App.pageManager.type === 'comments';

	// Plugins that should be included in pages of type "comments" only (no wiki).
	const commentsPagePlugins = [
		Mention, QuoteSelection
	];

	return {
		plugins: [
			Essentials, Paragraph, Autoformat,
			Image, ImageUpload, GitHubUploadAdapter,
			HeadingSwitch,
			Bold, Italic, SmartCode, Strikethrough,
			BlockQuote,
			Link,
			List, TodoList,
			HorizontalLine, Table, TableToolbar,
			Kebab, RemoveFormat, ModeSwitcher,
			PasteFromOffice,
			ResetListener
		].concat( isCommentsPage ? commentsPagePlugins : [] ),
		toolbar: [
			'headingswitch', 'bold', 'italic', '|',
			'blockquote', 'smartcode', 'link', '|',
			'bulletedlist', 'numberedlist', 'todolist', 'kebab'
		],
		kebabToolbar: isCommentsPage ?
			[ 'strikethrough', 'removeFormat', '|', 'imageupload', 'horizontalline', 'insertTable', '|', 'mode' ] :
			[ 'strikethrough', 'removeFormat', '|', 'horizontalline', 'insertTable', '|', 'mode' ],
		table: {
			contentToolbar: [ 'tableColumn', 'tableRow', 'mergeTableCells' ]
		},
		placeholder: isCommentsPage ? 'Leave a comment' : null,
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
			feeds: isCommentsPage && getMentionConfig()
		},
		githubRte: {
			/**
			 * A function that, when called, returns a promise that resolves with the upload configuration object,
			 * used by the upload adapter with the following properties:
			 *   - url: the GitHub url that makes the upload arrangements (see UploadAdapter).
			 *   - form: an object with properties representing additional fields (name/value)
			 *     to be posted to the above url.
			 *
			 * The reason for this being a function<promise> is that, for some pages (wiki), the upload
			 * configuration is not available in the page and a xhr request is necessary to retrieve it.
			 * We want this xhr request to be done on demand, for the first upload executed.
			 *
			 * @type {Function<Promise>} a function that, when called, returns a promise that resolves
			 * with the upload configuration object.
			 */
			upload: getUploadConfig()
		}
	};

	// Returns a function that, when called, will return a promise that resolves with the upload configuration object.
	//
	// The logic in this function may be a bit complex because the goal is making it in a way that the promise
	// resolution logic (which in wiki pages involves a xhr request) is not executed here when setting up the
	// configurations but on the first time the configuration is required (on the first attempt to upload a file).
	function getUploadConfig() {
		// Try to get the element holding the upload related data.
		const uploadDataElement = rteEditor.githubEditor.markdownEditor.dom.textarea.closest( '*[data-upload-policy-url]' );

		// This element is most likely not present in wiki pages, so we need a different strategy for it.
		if ( !uploadDataElement && App.pageManager.type === 'wiki' ) {
			return getConfigFunction( () => {
				// Make a xhr request to retrieve the dom of the "New Issue" page.
				return getNewIssuePageDom()
					// Take the element with the upload information out of that page.
					.then( rootElement => rootElement.querySelector( '*[data-upload-policy-url]' ) )
					.then( uploadDataElement => getConfigPromise( uploadDataElement ) );
			} );
		}

		// If the element was found, we're all set.
		return getConfigFunction( () => getConfigPromise( uploadDataElement ) );

		// Builds the configuration function, which caches the returned promise so  its resolution logic is executed just once.
		function getConfigFunction( promiseBuilder ) {
			let configPromise;

			// We don't return the promise straight, but a function that, once called, will generate the promise
			// (if necessary) and return it.
			return () => {
				if ( !configPromise ) {
					configPromise = promiseBuilder();
				}

				return configPromise;
			};
		}

		// Builds the promise that resolves with the configuration object.
		function getConfigPromise( element ) {
			return Promise.resolve( {
				url: element.getAttribute( 'data-upload-policy-url' ),
				form: {
					authenticity_token: element.getAttribute( 'data-upload-policy-authenticity-token' ),
					repository_id: element.getAttribute( 'data-upload-repository-id' )
				}
			} );
		}
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
