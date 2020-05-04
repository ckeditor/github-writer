/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Enter from '../plugins/enter';
import AutoFormat from '../plugins/autoformat';

import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import SmartCode from '../plugins/smartcode';
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';
import Kbd from '@mlewand/ckeditor5-keyboard-marker/src/Kbd';

import HeadingDropdown from '../plugins/headingdropdown';
import HeadingTabKey from '../plugins/headingtabkey';

import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote';

import List from '@ckeditor/ckeditor5-list/src/list';
import TodoList from '@ckeditor/ckeditor5-list/src/todolist';

import Link from '@ckeditor/ckeditor5-link/src/link';

import Image from '@ckeditor/ckeditor5-image/src/image';
import ImageUpload from '@ckeditor/ckeditor5-image/src/imageupload';
import GitHubUploadAdapter from '../plugins/githubuploadadapter';

import HorizontalLine from '@ckeditor/ckeditor5-horizontal-line/src/horizontalline';

import Table from '@ckeditor/ckeditor5-table/src/table';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';

import Mention from '@ckeditor/ckeditor5-mention/src/mention';
import RteEditorConfigMentions from './rteeditorconfigmentions';
import Emoji from '../plugins/emoji';

import Kebab from '../plugins/kebab';
import RemoveFormat from '@ckeditor/ckeditor5-remove-format/src/removeformat';
import ModeSwitcher from '../plugins/modeswitcher';
import Suggestion from '../plugins/suggestion';

import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import PasteFixer from '../plugins/pastefixer';
import AutoLinking from '../plugins/autolinking';
import QuoteSelection from '../plugins/quoteselection';
import Messenger from '../plugins/messenger';
import EditorExtras from '../plugins/editorextras';
import ControlClick from '../plugins/controlclick';
import SmartCaret from '../plugins/smartcaret';
import CodeBlockLanguageSelector from '../plugins/codeblocklanguageselector';
import SavedReplies from '../plugins/savedreplies';
import LiveModelData from '../plugins/livemodeldata';

import App from '../app';
import { config as languagesConfig } from '../modules/languages';
import { list as emojiList } from '../data/emojis';
import { getNewIssuePageDom } from '../util';

const RteEditorConfig = {
	/**
	 * Gets the configuration for the CKEditor instances to be created by the rte editor.
	 *
	 * @param {RteEditor} rteEditor The rte editor asking for the configurations.
	 * @returns {Object} A configuration object ready to be loaded in a CKEditor instance creation.
	 */
	get: rteEditor => {
		// There are some special differences among "comments" and "no-comments" (wiki) pages.
		const isCommentsPage = App.pageManager.type === 'comments';

		const config = {
			plugins: [
				Essentials, Paragraph, Enter, AutoFormat, Mention, Emoji,
				Image, ImageUpload, GitHubUploadAdapter,
				HeadingDropdown, HeadingTabKey,
				Bold, Italic, SmartCode, Strikethrough, Kbd,
				BlockQuote,
				Link,
				List, TodoList,
				HorizontalLine, Table, TableToolbar,
				Kebab, RemoveFormat, ModeSwitcher, Suggestion,
				PasteFromOffice, PasteFixer,
				AutoLinking, QuoteSelection, SavedReplies, Messenger, EditorExtras, ControlClick, SmartCaret,
				CodeBlockLanguageSelector,
				LiveModelData
			],
			toolbar: [
				'headingdropdown', 'bold', 'italic', '|',
				'blockquote', 'smartcode', 'link', '|',
				'bulletedlist', 'numberedlist', 'todolist', '|',
				'savedreplies', 'kebab'
			],
			kebabToolbar: [ 'strikethrough', 'kbd', 'removeFormat', '|', 'imageupload', 'horizontalline', 'insertTable', '|', 'mode' ],
			table: {
				contentToolbar: [ 'tableColumn', 'tableRow' ]
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
				feeds: getMentionsConfig()
			},
			codeBlock: {
				languages: languagesConfig.concat( [] )	// copy
			},
			githubWriter: {
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
				upload: getUploadConfig(),

				/**
				 * Specifies the auto-linking features to be enabled.
				 */
				autoLinking: {
					person: isCommentsPage,
					issue: isCommentsPage,
					sha: isCommentsPage,
					urlGitHub: isCommentsPage,
					url: true
				},

				/**
				 * Configurations for the "suggestion" feature.
				 */
				suggestion: {
					/**
					 * Indicates that the suggestion feature should be enabled in the editor.
					 */
					enabled: checkSuggestionEnabled( rteEditor )
				},

				/**
				 * Configurations for the "saved reply" feature.
				 */
				savedReplies: {
					url: getSavedRepliesUrl( rteEditor )
				}
			}
		};

		// Add the suggestion button to the toolbar only if the suggestion is enabled.
		if ( config.githubWriter.suggestion.enabled ) {
			config.toolbar.unshift( 'suggestion', '|' );
		}

		// Remove the Saved Replies feature if there is no support for it.
		if ( !config.githubWriter.savedReplies.url ) {
			config.plugins = config.plugins.filter( item => item !== SavedReplies );
			config.toolbar = config.toolbar.filter( item => item !== 'savedreplies' );
		}

		return config;

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

			// Builds the configuration function, which caches the returned promise so its resolution logic is executed just once.
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
				let authenticityToken = element.getAttribute( 'data-upload-policy-authenticity-token' );

				// GitHub changed and the token may not be available as an attribute anymore but inside an input[hidden].
				if ( !authenticityToken ) {
					const tokenElement = element.querySelector( '.js-data-upload-policy-url-csrf' );
					authenticityToken = tokenElement && tokenElement.value;
				}

				return Promise.resolve( {
					url: element.getAttribute( 'data-upload-policy-url' ),
					form: {
						authenticity_token: authenticityToken,
						repository_id: element.getAttribute( 'data-upload-repository-id' )
					}
				} );
			}
		}

		/**
		 * Gets the configuration for mentions feeds.
		 *
		 * @returns {Object|null} The configuration object or `null` if the page is not compatible with mentions.
		 */
		function getMentionsConfig() {
			// Get the GH DOM element that holds the urls from which retrieve mentions, if available.
			const textExpanderElement = rteEditor.githubEditor.markdownEditor.dom.textarea.closest( 'text-expander' );

			// Some pages (wiki) don't have mentions in the native GH. In those, let's enable just emoji (for now).
			if ( !textExpanderElement ) {
				return RteEditorConfigMentions.get( {
					emoji: emojiList
				} );
			}

			// Call the util to build the configuration.
			return RteEditorConfigMentions.get( {
				issues: textExpanderElement.getAttribute( 'data-issue-url' ),
				people: textExpanderElement.getAttribute( 'data-mention-url' ),
				emoji: emojiList
			} );
		}

		/**
		 * Checks if this editor should have the suggestion button.
		 * @param rteEditor
		 * @returns {boolean}
		 */
		function checkSuggestionEnabled( rteEditor ) {
			// It should be enabled if the suggestion button is available in the markdown toolbar.
			const toolbar = rteEditor.githubEditor.markdownEditor.dom.toolbar;
			const button = toolbar && toolbar.querySelector( 'button.js-suggested-change-toolbar-item' );
			return !!button;
		}

		/**
		 * Gets the Saved Replies url from the dom.
		 *
		 * @param rteEditor
		 * @returns {String} The url.
		 */
		function getSavedRepliesUrl( rteEditor ) {
			const toolbar = rteEditor.githubEditor.markdownEditor.dom.toolbar;
			const el = toolbar && toolbar.querySelector( '.js-saved-reply-menu[src]' );
			return el && el.getAttribute( 'src' );
		}
	}
};

export default RteEditorConfig;
