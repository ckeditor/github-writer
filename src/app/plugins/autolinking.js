/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Range from '@ckeditor/ckeditor5-engine/src/model/range';
import LiveRange from '@ckeditor/ckeditor5-engine/src/model/liverange';
import TreeWalker from '@ckeditor/ckeditor5-engine/src/model/treewalker';

import { createElementFromHtml, openXmlHttpRequest } from '../util';

/**
 * The auto-linking feature, which makes plain text that will be converted to links by GitHub to behave just like
 * the final output.
 *
 * The follow text patterns are covered:
 *  - @user-name for user mentions.
 *  - #123, organization/repository#123 and full URL for issue links.
 *  - <hex>, organization/repository#<hex> and full URL for commit links.
 *  - urls, in general.
 */
export default class AutoLinking extends Plugin {
	/**
	 * @inheritDoc
	 */
	init() {
		// Get the list of features to be enabled.
		const config = this.editor.config.get( 'githubWriter.autoLinking' );

		// This is the class instance that will be used to retrieve and cache additional information about the GitHub links.
		// This extra information will be used by GH itself to show the hover cards of the links.
		const linkDataLoader = new GitHubLinkDataLoader();

		// The auto-linking engine.
		const autolink = new AutoLinkStyler( this.editor );

		// Setup the auto-linker to match all GitHub linking patterns we want to handle.
		{
			// @user-name
			// @organization/user-name
			config.person && autolink.addPattern(
				/@(?:[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+(?:\/[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+)?)/i,
				'person',
				githubLinkCallback );

			// #1
			// mojombo#1
			// mojombo/github-flavored-markdown#1
			config.issue && autolink.addPattern(
				/(?:[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+(?:\/[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+)?)?#\d+/i,
				'issue',
				githubLinkCallback );

			// 16c999e8c71134401a78d4d46435517b2271d6ac
			// mojombo@16c999e8c71134401a78d4d46435517b2271d6ac
			// mojombo/github-flavored-markdown@16c999e8c71134401a78d4d46435517b2271d6ac
			config.sha && autolink.addPattern(
				/(?:[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+(?:\/[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+)?@)?[a-f\d]{7,40}/i,
				'sha',
				githubLinkCallback );

			// GitHub urls
			config.urlGitHub && config.issue && autolink.addPattern(
				/https:\/\/github\.com\/.*\/(?:issues|pull)\/[^\s]+?/i,
				'issue',
				githubLinkCallback );
			config.urlGitHub && config.sha && autolink.addPattern(
				/https:\/\/github\.com\/.*\/commit\/[^\s]+?/i,
				'sha',
				githubLinkCallback );

			// Other urls
			config.url && autolink.addPattern(
				// eslint-disable-next-line max-len
				/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[A-Z0-9+&@#/%=~_|$])/i,
				'url', attribs => ( attribs.url = attribs.text ) );
		}

		/**
		 * The callback called whenever a GitHub auto-linking pattern is found.
		 *
		 * @param attribs The attributes to set to the matched text.
		 * @returns {Promise|boolean} "false" to not auto-link, a promise that resolves with the list of attributes
		 * or anything else to confirm the auto-link.
		 */
		function githubLinkCallback( attribs ) {
			// Take the link data for the matched text.
			const linkData = linkDataLoader.load( attribs.text );

			// If this is a valid GitHub auto-link.
			if ( linkData ) {
				// For the first time for this text, we should probably have a promise returned, because we're waiting
				// for GH to send the extra data about this link back.
				if ( linkData instanceof Promise ) {
					return linkData;
				} else {
					// Next calls will be cached, so we have the data straight.
					Object.assign( attribs, linkData );
				}
			}

			// Enabled auto-link for valid GH links only (e.g. existing users and issues).
			return linkData !== false;
		}
	}
}

/**
 * Watches for text patterns during changes in the editor and applies the "autolink" attribute to matching words.
 */
export class AutoLinkStyler {
	/**
	 * Creates and instance of the AutoLinkStyler class and enabled it in an editor.
	 * @param editor The editor to enable auto-link in.
	 */
	constructor( editor ) {
		// Schema and conversion.
		{
			editor.model.schema.extend( '$text', { allowAttributes: 'autolink' } );
			editor.model.schema.setAttributeProperties( 'autolink', {
				isFormatting: false,
				copyOnEnter: false
			} );

			// Downcast is defined for editing only, because we want the plain-text only in the data output,
			// which is the whole point of auto-linking, in fact.
			editor.conversion.for( 'editingDowncast' ).attributeToElement( {
				model: 'autolink',
				view: ( modelValue, viewWriter ) => {
					let attribs;

					if ( modelValue ) {
						attribs = {};

						if ( modelValue.enabled !== false ) {
							// Disable spell-checking in auto-links.
							attribs.spellcheck = 'false';
						}

						// All properties available in the attribute value are converted to data attributes.
						Object.keys( modelValue ).forEach( name => ( attribs[ 'data-' + name ] = modelValue[ name ] ) );
					}

					// Using the same priority as link for compatibility with ControlClick.
					return viewWriter.createAttributeElement( 'autolink', attribs, { priority: 5 } );
				}
			} );
		}

		// Enable the styler that will watch the document for changes and apply the "autolink" attribute.
		this._matchStyle = new WordMatchStyler( 'autolink' );
		this._matchStyle.watch( editor );
	}

	/**
	 * Adds a pattern to be observed in the text of the editor.
	 *
	 * An optional callback can be passed. This callback receives and object that can be manipulated to add attributes
	 * to the autolink conversion. The "type" (the pattern type) and "text" (the matched text) are passed to the callback.
	 * All defined attributes will be output as "data-<attribute>" entries during conversion.
	 *
	 * The callback return value has the following possibilities:
	 *  - The "false" (explicit boolean, not falsy) to say that the matched pattern should not be auto-linked.
	 *  - A promise, which when resolved returns the attributes object. While waiting for the promise,
	 *    the attributes object sent to the callback will be applied anyway.
	 *  - Any other value or nothing, to confirm the auto-link.
	 *
	 * @param pattern {RegExp} The regular expression used to match words. This expression should consider just
	 *        the words and nothing around it. It must not include the `^` and `$` anchors.
	 * @param type {String} A name to be included as the "data-type" attribute of the auto-link.
	 * @param [callback] {Function} The function to be called when a match is found for this pattern.
	 */
	addPattern( pattern, type, callback ) {
		// As matter of fact, this is mostly a pass-though to the styler.
		this._matchStyle.addMatcher( pattern, attributes => {
			// Add the type to the list of attributes.
			attributes.type = type;

			// Let the callback do its job.
			return !callback || callback( attributes );
		} );
	}
}

/**
 * Keep a desired attribute applied to all (and only to) occurrences of matched words in the document.
 */
export class WordMatchStyler {
	/**
	 * Creates an instance of the WordMatchStyler class.
	 *
	 * @param attribute {String} The attribute to be set to matched text... and removed from unmatched.
	 */
	constructor( attribute ) {
		/**
		 * The name of the attribute to be set into matched text.
		 * @type {String}
		 */
		this.attribute = attribute;

		this._matchers = [];
	}

	/**
	 * Adds a pattern to match words that need styling.
	 *
	 * The callback passed to this method receives and object that can be manipulated to add attributes to the match
	 * during conversion. The "text" (the matched text) attribute is passed to the callback. All defined attributes
	 * will be output as "data-<attribute>" entries during conversion.
	 *
	 * The callback return value has the following possibilities:
	 *  - The "false" (explicit boolean, not falsy) to say that the matched text will have the "enabled" attribute set to "false".
	 *  - A promise, which when resolved returns the attributes object. While waiting for the promise,
	 *    the attributes object sent to the callback will be applied anyway.
	 *  - Any other value or nothing, to set the "enabled" attribute to "true".
	 *
	 * @param pattern {RegExp} The regular expression used to match words. This expression should consider just
	 *        the words and nothing around it. It must not include the `^` and `$` anchors.
	 * @param [callback] {Function} The function to be called when a match is found for this pattern.
	 */
	addMatcher( pattern, callback ) {
		// Take the original regex flags and ensure that this is a global regex.
		const flags = pattern.flags.replace( /g|$/, 'g' );

		// Build the regex used to match words. It includes characters that can be around words, like punctuation.
		const regex = new RegExp( `([ \u00a0"'(]|^)(${ pattern.source })(?=(?:[ \u00a0]|[ \u00a0"'.,:;)?!]+(?: |$))|$)`, flags );

		// Save it as a matcher definition object.
		this._matchers.push( { regex, callback } );
	}

	/**
	 * Enabled the watcher into an editor.
	 *
	 * @param editor {Editor} The editor.
	 */
	watch( editor ) {
		const model = editor.model;
		const attribute = this.attribute;
		const matchers = this._matchers;

		// Task 1 of 2: watch for changes.
		watchChanges();

		// Task 2 of 2: fix the selection.
		fixSelection();

		/**
		 * Watches for changes, lists text sequences touched by them and fires the matching checks.
		 */
		function watchChanges() {
			// Create a post-fixer because it is the most reliable way to listen to everything that happens in the model.
			model.document.registerPostFixer( writer => {
				const changes = model.document.differ.getChanges();

				// It is very common to receive empty diffs, so we avoid them.
				if ( !changes.length ) {
					return;
				}

				// Create the Text Finder which will accumulate all texts potentially touched by the change.
				const textFinder = new TextFinder();

				changes.forEach( change => {
					switch ( change.type ) {
						case 'attribute': {
							// Ignore changes related to the styler attribute.
							if ( change.attributeKey !== attribute ) {
								// Other attributes may have been assigned to partial parts of words, so want to
								// check the words at the boundaries of the change to ensure that the styler attribute
								// is appropriate there.
								textFinder.findWordAtPosition( change.range.start );
								textFinder.findWordAtPosition( change.range.end );
							}
							break;
						}
						case 'insert': {
							// Create a range that embraces the whole change.
							let range = writer.createRange(
								change.position,
								change.position.getShiftedBy( change.length )
							);

							// For a text insertion, expand the range to include whole words in the boundaries.
							if ( change.name === '$text' ) {
								range = TextExpander.word( range );
							}

							// Find all texts inside the range.
							textFinder.findInRange( range );
							break;
						}
						case 'remove': {
							// On removal, we may have texts collapsing and forming words. We want to check them.
							textFinder.findWordAtPosition( change.position );
							break;
						}
					}
				} );

				// Finally, check all texts found.
				checkTexts( textFinder.texts, writer );
			} );
		}

		/**
		 * Goes through a list of texts and fires the search for matched words and their styling into them.
		 *
		 * @param texts {Object[]} The list of texts.
		 * @param texts.text {String} The text to be checked.
		 * @param texts.range {Range} The range in the model that contains the text.
		 * @param writer {Writer} Writer used to make model changes.
		 */
		function checkTexts( texts, writer ) {
			// We don't do much here. Still, `checkTexts` is called in more than one part of the code.
			texts.forEach( textInfo => {
				const { text, range } = textInfo;
				const validRanges = Array.from( editor.model.schema.getValidRanges( [ range ], attribute ) );
				validRanges.forEach( validRange => styleWordsInRange( { text, range: validRange }, writer ) );
			} );
		}

		/**
		 * Resets (removes) the attribute from a text range and then searches for words to be styled into it,
		 * firing their styling.
		 *
		 * @param text {String} The text to be checked.
		 * @param range {Range} The range in the model that contains the text.
		 * @param writer {Writer} Writer used to make model changes.
		 */
		function styleWordsInRange( { text, range }, writer ) {
			// Remove the attribute from the whole range first.
			writer.removeAttribute( attribute, range );

			model.enqueueChange( writer.batch, writer => {
				const matches = [];

				// Run all matchers over the text, accumulating all matches found in the above array.
				matchers.forEach( ( { regex, callback } ) => {
					for ( const match of text.matchAll( regex ) ) {
						// Get a clean range, containing the word part of the match only.
						const matchRange = getWordMatchRange( match, range );

						if ( checkWordRangeValid( matchRange ) ) {
							// Save a reference to the matcher callback, so we can pass it along later in this function.
							matchRange.callback = callback;
							matches.push( matchRange );
						}
					}
				} );

				if ( matches.length ) {
					// Remove ranges that are intersecting (just one matcher per word).
					matches.forEach( ( range, index ) => {
						for ( let i = index + 1; i < matches.length; i++ ) {
							const next = matches[ i ];
							if ( next && range.isIntersecting( next ) ) {
								delete matches[ i ];
							}
						}
					} );

					// Finally, style every word found.
					matches.forEach( range => {
						styleMatchedWord( writer, range.text, range, range.callback );
					} );
				}
			} );

			/**
			 * Gets a range containing only the word part of the match (without the prefix).
			 *
			 * @param match A match from a matcher regex.
			 * @param parentRange The original range into which the regex has been executed.
			 * @return {Range} A range for the word part of the match.
			 */
			function getWordMatchRange( match, parentRange ) {
				// Take the matched text from 2nd matching group.
				const text = match[ 2 ];
				const length = text.length;

				// The index for the above text in the parentRange must be shifted by the word prefix, 1st matching group.
				const index = match.index + match[ 1 ].length;

				// The range that holds the matched text.
				const wordRange = new Range(
					parentRange.start.getShiftedBy( index ),
					parentRange.start.getShiftedBy( index + length )
				);

				// Saves the text into the range.
				wordRange.text = text;

				return wordRange;
			}

			/**
			 * Checks if a range is valid for the styler by ensuring that there is not formatting attributes
			 * set to just part of it.
			 *
			 * @param range The range to be checked.
			 * @return {boolean} `true` if the range is valid.
			 */
			function checkWordRangeValid( range ) {
				// Get all nodes inside the range.
				const nodes = Array.from( range.getItems() );
				let valid = true;

				if ( nodes.length > 1 ) {
					// Get all formatting attributes from the first node.
					const attribs = Array.from( nodes.shift().getAttributeKeys() )
						.filter( attribute => model.schema.getAttributeProperties( attribute ).isFormatting );

					// Search throw the next nodes for one that doesn't have exactly the same above attributes.
					valid = !nodes.find( node => {
						// Take the formatting attributes of the next node.
						const otherAttribs = Array.from( node.getAttributeKeys() )
							.filter( attribute => model.schema.getAttributeProperties( attribute ).isFormatting );

						// Ensure that the first node and this one have the very same formatting attributes.
						return otherAttribs.length !== attribs.length ||
							otherAttribs.find( otherAttrib => !attribs.includes( otherAttrib ) );
					} );
				}

				return valid;
			}
		}

		/**
		 * Sets the attribute to a matched word.
		 *
		 * @param writer {Writer} The model writer used to set the attribute (synchronously).
		 * @param matchText {String} The text matched.
		 * @param matchRange {Range} The range encompassing the text.
		 * @param matcherCallback {Function} The callback passed to `addMatcher`.
		 */
		function styleMatchedWord( writer, matchText, matchRange, matcherCallback ) {
			// Save the text in the list of attributes be set.
			const attribs = { text: matchText };

			// Call the callback.
			const callbackReturn = matcherCallback && matcherCallback( attribs );

			// The callback can return a promise, which will enable a second step on the attribute setting,
			// once such promise resolves.
			if ( callbackReturn instanceof Promise ) {
				// We don't know what may happened to the model while waiting for the promise to
				// resolve, so we create a live range for the match.
				const liveMatchRange = LiveRange.fromRange( matchRange );
				// let changed = false;
				// liveMatchRange.once( 'change:content', () => ( changed = true ) );

				callbackReturn.then( () => {
					// To play safe, we don't care about any return value from the promise and
					// instead, check again the texts touched by the boundaries of the range.
					// If nothing change, the same word will be checked and this time we expect
					// a non promise to be returned by the callback.
					// TODO: We should actually just check if the range changed and manage its return value instead.
					const textFinder = new TextFinder();
					textFinder.findWordAtPosition( liveMatchRange.start );
					textFinder.findWordAtPosition( liveMatchRange.end );

					liveMatchRange.detach();

					model.enqueueChange( writer.batch, writer => {
						checkTexts( textFinder.texts, writer );
					} );
				} );
			}

			// A boolean `false` can be returned by the callback to set the "enabled" attribute to "false".
			attribs.enabled = ( callbackReturn !== false );

			// Set the attribute to the range straight away if:
			//  - The callback returned `false`.
			//	- Or, the callback returned a Promise.
			//	- Or, the text attribute remain unchanged by the callback.
			if ( callbackReturn === false || callbackReturn instanceof Promise || attribs.text === matchText ) {
				writer.setAttribute( attribute, attribs, matchRange );
			} else {
				// Otherwise, the text attribute changed, so we delete the matched text and replace it.
				writer.remove( matchRange );
				writer.insertText( attribs.text, { [ attribute ]: attribs }, matchRange.start );

				// This change may have a cascade effect with other matchers, so we check the replacement now.
				const textFinder = new TextFinder();
				textFinder.findWordAtPosition( matchRange.start );
				checkTexts( textFinder.texts, writer );
			}
		}

		/**
		 * Fixes the selection because ot cannot have the styler attribute otherwise it'll enlarge styled words when
		 * typing space at the end of them.
		 */
		function fixSelection() {
			const selection = model.document.selection;

			selection.on( 'change:range', checkSelection );
			selection.on( 'change:attribute', checkSelection );

			function checkSelection() {
				if ( selection.hasAttribute( attribute ) ) {
					const pos = selection.anchor;
					// We don't want to remove the attribute when inside the text node but when over its boundaries.
					if ( !pos.textNode ) {
						model.enqueueChange( 'transparent', writer => {
							writer.removeSelectionAttribute( attribute );
						} );
					}
				}
			}
		}
	}
}

/**
 * Builds a list of text sequences that touch or are included in certain parts of the model.
 */
export class TextFinder {
	/**
	 * Creates an instance of the TextFinder class.
	 */
	constructor() {
		/**
		 * Stores all texts found while calling the class methods.
		 *
		 * @type texts {Object[]}
		 * @type texts.text {String} The text found.
		 * @type texts.range {Range} The range in the model that contains the text.
		 */
		this.texts = [];
	}

	/**
	 * Finds text that represent a word touched by a model position.
	 *
	 * @param position {Position} The model position.
	 */
	findWordAtPosition( position ) {
		// Search for the word.
		const range = getWordRangeFromPosition( position );

		if ( range ) {
			// Check if the word is already stored and do do it again.
			if ( !this.texts.find( item => {
				return item.range.isEqual( range );
			} ) ) {
				// Store the text.
				this.texts.push( {
					// Concatenate all text nodes inside the range.
					text: Array.from( range.getItems() )
						.reduce( ( output, item ) => ( output + item.data ), '' ),
					range
				} );
			}
		}

		/**
		 * Gets the range enclosing the word touched by a model position.
		 * @param position
		 * @returns {Range} A range, if a word was found, or null.
		 */
		function getWordRangeFromPosition( position ) {
			const startPosition = findWordBoundary( position, 'backward' );
			const endPosition = findWordBoundary( position, 'forward' );

			// If we ended up on the same position, no word was found.
			if ( !startPosition.isEqual( endPosition ) ) {
				return new Range( startPosition, endPosition );
			}

			/**
			 * Finds a word boundary (space) by walking through the model.
			 *
			 * @param startPosition {Position} The position where to start the walk.
			 * @param direction {String} Either 'backward' or 'forward'.
			 * @returns {Position} The word boundary position.
			 */
			function findWordBoundary( startPosition, direction ) {
				const walker = new TreeWalker( {
					direction,
					startPosition,
					singleCharacters: true
				} );

				// Keep moving while we're inside text which is not a space.
				walker.skip( value => {
					return value.type === 'text' && value.item.data !== ' ';
				} );

				return walker.position;
			}
		}
	}

	/**
	 * Finds all texts inside a range.
	 *
	 * Consecutive text nodes are found as a single text.
	 *
	 * @param range {Range} The range to be searched.
	 */
	findInRange( range ) {
		const walker = range.getWalker();

		// Walk through the range, processing all text sequences available inside it.
		while ( !walker.position.isEqual( range.end ) ) {
			// Find the next available text sequence positions.

			// Step 1: Set the start position right before the first text node found.
			walker.skip( value => value.type !== 'text' );
			const textStart = walker.position;

			// Step 2: Set the end position after all consecutive text nodes available.
			walker.skip( value => value.type === 'text' );
			const textEnd = walker.position;

			// Step 3: If the above positions are different, text to be processed has been found.
			if ( !textStart.isEqual( textEnd ) ) {
				// Create a range that encloses the whole text found.
				const textRange = new Range( textStart, textEnd );

				// Concat the text nodes and return the final value as a string.
				const text = Array.from( textRange.getItems() )
					.reduce( ( text, textNode ) => ( text + textNode.data ), '' );

				this.texts.push( { text, range: textRange } );
			}
		}
	}
}

/**
 * Expand a range to contain text touched by its boundaries according to a criteria.
 */
export class TextExpander {
	/**
	 * Return an expanded range that includes any word touched by the boundaries of a range.
	 *
	 * Examples:
	 * ```
	 * "one tw[o th]ree four" => "one [two three] four"
	 * "one[ two ]three four" => "[one two three] four"
	 * "one t[]wo three four" => "one [two] three four"
	 * "one two []three four" => "one two [three] four"
	 * "one [two three] four" => "one [two three] four"
	 * ```
	 * @param range {Range} The starting range.
	 * @returns {Range} The expanded range.
	 */
	static word( range ) {
		return new Range(
			TextWalker.word( range.start, 'backward' ),
			TextWalker.word( range.end ) );
	}
}

/**
 * Moves a model position over consecutive characters.
 */
export class TextWalker {
	/**
	 * Initializes a new instance of the TextWalker class.
	 *
	 * @param options {Object} Options.
	 * @param options.startPosition {Position} The position where to start walking from.
	 * @param options.direction = 'forward' {String} The walking direction ('forward' or 'backward').
	 */
	constructor( options ) {
		this._walker = new TreeWalker( {
			direction: options.direction || 'forward',
			startPosition: options.startPosition,
			singleCharacters: true
		} );
	}

	/**
	 * The current position.
	 *
	 * @return {Position}
	 */
	get position() {
		return this._walker.position;
	}

	/**
	 * Walks over the next character, if any.
	 *
	 * @return {String|null} The character. Null if not found.
	 */
	char() {
		let char = null;
		this._walker.skip( value => ( !char && value.type === 'text' && !!( char = value.item.data ) ) );
		return char;
	}

	/**
	 * Gets the position that touches a word boundary by walking over characters.
	 *
	 * @param position {Position} The position where to start walking from.
	 * @param direction {String} Either 'forward' or 'backward'.
	 * @return {Position} The boundary position.
	 */
	static word( position, direction = 'forward' ) {
		const charWalker = new TextWalker( {
			direction,
			startPosition: position,
			singleCharacters: true
		} );

		// Match different characters, depending on the direction.
		const boundaryTester = ( direction === 'forward' ? /[.,;:?!]/ : /[¿¡]/ );

		let char;
		while ( ( char = charWalker.char() ) ) {
			// Stop walking as soon as a space is found.
			if ( /\s/.test( char ) ) {
				break;
			}

			// Word boundaries stay on hold until the next character.
			if ( boundaryTester.test( char ) ) {
				continue;
			}

			// A valid word character was found. Save it's position.
			position = charWalker.position;
		}

		return position;
	}
}

/**
 * Checks if a piece of text is a GitHub auto-link and download extra data about it in such case.
 */
export class GitHubLinkDataLoader {
	/**
	 * Creates and instance of the GitHubLinkDataLoader class.
	 */
	constructor() {
		/**
		 * Cache containing all the text information found so far.
		 *
		 * @type {Object}
		 */
		this._cache = {};
	}

	/**
	 * Gets the url information of the GitHub preview creator.
	 *
	 * @return {{url: String, token: String}} The url information.
	 */
	getPreviewUrlInfo() {
		if ( !this._urlInfo ) {
			// Everything is available in the dom.
			const urlElement = document.querySelector( '[data-preview-url]' );
			const tokenElement = urlElement && urlElement.querySelector( 'input.js-data-preview-url-csrf' );

			if ( tokenElement ) {
				this._urlInfo = {
					url: urlElement.getAttribute( 'data-preview-url' ),
					token: tokenElement.value
				};
			} else {
				console.error( 'GitHub Writer error: could not retrieve the preview url.' );
			}
		}

		return this._urlInfo;
	}

	/**
	 * Checks a text for auto-linking and returns its extra data, if any.
	 *
	 * This method can return one of these values:
	 *  - The extra data as an object.
	 *  - A promise, which resolves with the above data.
	 *  - The boolean `false`, indicating that this text doesn't auto-link in GitHub.
	 *
	 * @param text The text to be checked.
	 * @return {Object|Promise|Boolean} The extra data, or a promise that will return it, or `false`.
	 */
	load( text ) {
		const key = text;

		if ( !Object.prototype.hasOwnProperty.call( this._cache, key ) ) {
			// Get the GitHub preview for this text.
			this._cache[ key ] = new Promise( resolve => {
				downloadPreview.call( this )
					.then( container => {
						// If a link is returned, then auto-link is available for this text.
						const link = container.querySelector( 'a' );
						let linkData;

						if ( link ) {
							const returnedText = link.textContent;

							// Get the extra data from the link itself.
							linkData = {
								url: link.getAttribute( 'href' ),

								// GitHub may have a different text for this as well. e.g. when pasting an issue url.
								// Ignore the returned text if it contains space (it's not a single word).
								text: /\s/.test( returnedText ) ? text : returnedText,

								// This enables hover cards on the auto-link.
								'hovercard-type': link.getAttribute( 'data-hovercard-type' ),
								'hovercard-url': link.getAttribute( 'data-hovercard-url' )
							};

							// If the text changed, cache the data for the new text as well.
							if ( linkData.text !== text ) {
								this._cache[ linkData.text ] = linkData;
							}
						} else {
							// No link, so disable auto-linking.
							linkData = false;
						}

						// The cache now points to the data itself, not to the promise anymore.
						this._cache[ key ] = linkData;

						resolve( linkData );
					} )
					.catch( err => {
						if ( err ) {
							console.error( err );
						}

						this._cache[ key ] = false;
						resolve( false );
					} );
			} );
		}

		return this._cache[ key ];

		/**
		 * Gets a promise that resolves with the html returned by the preview feature of GitHub.
		 *
		 * @return {Promise<String>} A promise that resolves to the html returned.
		 */
		function downloadPreview() {
			return new Promise( ( resolve, reject ) => {
				// Get the url information from the dom.
				// noinspection JSPotentiallyInvalidUsageOfClassThis
				const urlInfo = this.getPreviewUrlInfo();

				const xhr = openXmlHttpRequest( urlInfo.url );

				xhr.addEventListener( 'error', () => reject(
					new Error( `Error loading preview for auto-linking from ${ urlInfo.url }.` ) ) );
				xhr.addEventListener( 'abort', () => reject() );
				xhr.addEventListener( 'load', () => {
					resolve( createElementFromHtml( `<div>${ xhr.response }</div>` ) );
				} );

				const data = new FormData();
				// Just send the text and GitHub will give the preview back for it.
				data.append( 'text', text );
				data.append( 'authenticity_token', urlInfo.token );

				xhr.send( data );
			} );
		}
	}
}
