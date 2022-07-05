/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { config as languagesConfig } from '../data/languages';
import { list as emojiList } from '../data/emojis';
import CKEditorConfigMentions from './ckeditorconfigmentions';

import { getNewIssuePageDom } from '../modules/util';

const CKEditorConfig = {
	/**
	 * Gets the configuration for the CKEditor instances to be created by the rte editor.
	 *
	 * @param {Editor} githubEditor The rte editor asking for the configurations.
	 * @returns {Object} A configuration object ready to be loaded in a CKEditor instance creation.
	 */
	get: githubEditor => {
		const config = {
			// Plugins configuration is defined in CKEditorGitHubEditor.builtinPlugins.
			// plugins: [],
			toolbar: [
				'headingdropdown', 'bold', 'italic', '|',
				'blockquote', 'smartcode', 'link', '|',
				'bulletedlist', 'numberedlist', 'todolist', '|',
				'savedreplies', 'kebab'
			],
			image: {
				toolbar: [ 'imageTextAlternative' ]
			},
			kebabToolbar: [ 'strikethrough', 'kbd', 'removeFormat', '|',
				'imageupload', 'horizontalline', 'insertTable', 'mermaid', '|', 'mode' ],
			table: {
				contentToolbar: [ 'tableColumn', 'tableRow', 'mergeTableCells' ]
			},
			placeholder: githubEditor.placeholder,
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
					person: true,
					issue: true,
					sha: true,
					urlGitHub: true,
					url: true
				},

				/**
				 * Configurations for the "suggestion" feature.
				 */
				suggestion: {
					/**
					 * Indicates that the suggestion feature should be enabled in the editor.
					 */
					enabled: checkSuggestionEnabled( githubEditor )
				},

				/**
				 * Configurations for the "saved reply" feature.
				 */
				savedReplies: {
					url: getSavedRepliesUrl( githubEditor )
				}
			}
		};

		// Add the suggestion button to the toolbar only if the suggestion is enabled.
		if ( config.githubWriter.suggestion.enabled ) {
			config.toolbar.unshift( 'suggestion', '|' );
		}

		// Remove the Saved Replies feature if there is no support for it.
		if ( !config.githubWriter.savedReplies.url ) {
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
			const uploadDataElement = githubEditor.dom.textarea.closest( '[data-upload-policy-url]' );

			// Enable upload in pages that have no native support for it (e.g. wiki and code editor).
			if ( !uploadDataElement ) {
				return getConfigFunction( () => {
					// Make a xhr request to retrieve the dom of the "New Issue" page.
					return getNewIssuePageDom()
						// Take the element with the upload information out of that page.
						.then( rootElement => rootElement.querySelector( '[data-upload-policy-url]' ) )
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
			const textExpanderElement = githubEditor.dom.textarea.closest( 'text-expander' );

			// Some pages (wiki) don't have mentions in the native GH. In those, let's enable just emoji (for now).
			if ( !textExpanderElement ) {
				return CKEditorConfigMentions.get( {
					emoji: emojiList
				} );
			}

			// Call the util to build the configuration.
			return CKEditorConfigMentions.get( {
				issues: textExpanderElement.getAttribute( 'data-issue-url' ),
				people: textExpanderElement.getAttribute( 'data-mention-url' ),
				emoji: emojiList
			} );
		}

		/**
		 * Checks if this editor should have the suggestion button.
		 * @param githubEditor
		 * @returns {boolean}
		 */
		function checkSuggestionEnabled( githubEditor ) {
			// It should be enabled if the suggestion button is available in the markdown toolbar.
			const toolbar = githubEditor.dom.toolbar;
			const button = toolbar && toolbar.querySelector( 'button.js-suggested-change-toolbar-item' );
			return !!button;
		}

		/**
		 * Gets the Saved Replies url from the dom.
		 *
		 * @param githubEditor
		 * @returns {String} The url.
		 */
		function getSavedRepliesUrl( githubEditor ) {
			const toolbar = githubEditor.dom.toolbar;
			const el = toolbar && toolbar.querySelector( '.js-saved-reply-menu[src]' );
			return el && el.getAttribute( 'src' );
		}
	}
};

export default CKEditorConfig;
