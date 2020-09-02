/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import priorities from '@ckeditor/ckeditor5-utils/src/priorities';
import TextFinder from '../modules/textfinder';
import TextExpander from '../modules/textexpander';
import Range from '@ckeditor/ckeditor5-engine/src/model/range';
import LiveRange from '@ckeditor/ckeditor5-engine/src/model/liverange';

// The cached data associated to matched words. Global to the page, not specific to an editor instance.
let cache = {};

/**
 * Finds special words in the text marking them in the model. The search is based on finders
 * that can define the following:
 *        * The match pattern.
 *        * Data associated to the word.
 *        * View conversion for the matched word.
 */
export default class WordFinder extends Plugin {
	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		/**
		 * The instance of the WordFinder plugin for this editor.
		 *
		 * @type {WordFinderManager}
		 * @memberOf {Editor}
		 */
		editor.wordFinder = new WordFinderManager( editor );
	}
}

/**
 * The word finder implementation.
 */
class WordFinderManager {
	/**
	 * Creates an instance of the WordFinderManager class or a specific editor.
	 *
	 * @param editor {Editor} The editor.
	 */
	constructor( editor ) {
		/**
		 * The editor associated to this word finder.
		 *
		 * @type {Editor}
		 */
		this.editor = editor;

		/**
		 * The list of finders used to search for words.
		 *
		 * @type {Object[]}
		 * @private
		 */
		this._finders = [];

		/**
		 * The list of converters available.
		 *
		 * @type {Object}
		 * @private
		 */
		this._converters = {};

		// Register the "word" attribute into the schema.
		editor.model.schema.extend( '$text', { allowAttributes: 'word' } );
		editor.model.schema.setAttributeProperties( 'word', {
			isFormatting: false,
			copyOnEnter: false
		} );

		// Start watching the editor for changes.
		this._watch();
	}

	/**
	 * Adds a word finder based on a configuration.
	 *
	 * @param finder {{type:string,pattern:RegExp,?callback:function({}):string,?conversion:Object<string,function>}}
	 * 	The finder configuration.
	 */
	add( finder ) {
		const pattern = finder.pattern;

		// Take the original regex flags and ensure that this is a global regex.
		const flags = pattern.flags.replace( /g|$/, 'g' );

		// Build the regex used to match words. It includes characters that can be around words, like punctuation.
		const regex = new RegExp( `([ \u00a0"'(]|^)(${ pattern.source })(?=(?:[ \u00a0]|[ \u00a0"'.,:;)?!]+(?: |$))|$)`, flags );

		const priority = priorities.get( finder.priority );

		// Register the converters.
		if ( finder.conversion ) {
			Object.entries( finder.conversion ).forEach( ( [ conversionGroup, converter ] ) =>
				this._addConverter( conversionGroup, finder.type, converter ) );
		}

		// Create the final finder definition.
		finder = {
			regex,
			priority,
			type: finder.type,
			callback: finder.callback
		};

		const finders = this._finders;

		// Add the definition to the list of finders.
		for ( let i = 0; i <= finders.length; i++ ) {
			// Push the finder before the one with lower priority, or at the end.
			if ( !finders[ i ] || finders[ i ].priority < priority ) {
				finders.splice( i, 0, finder );
				break;
			}
		}
	}

	/**
	 * Clear the data cache, so it has to be recreated on next matches. This is added mainly for testing purposes.
	 */
	cleanCache() {
		cache = {};
	}

	/**
	 * Adds a converter provided by a finder to the specified conversion group.
	 *
	 * A converter is a function called to help during the conversion. In downcasting it receives
	 * the attributes to be applied to the element, so it can remove or add more if necessary.
	 * It must return the attribute name to be used in the view.
	 *
	 * @param conversionGroup {String} The conversion group. E.g. 'editingDowncast'.
	 * @param type {String} The finder type.
	 * @param converter {Function} The conversion function.
	 * @private
	 */
	_addConverter( conversionGroup, type, converter ) {
		let converters = this._converters[ conversionGroup ];

		// For the first call for this conversion group, setup the conversion listener.
		if ( !converters ) {
			converters = this._converters[ conversionGroup ] = {};
			this._setupConversion( conversionGroup );
		}

		converters[ type ] = converter;
	}

	/**
	 * Setups the conversion listener for the specified conversion group.
	 *
	 * @param conversionGroup {String} The conversion group. E.g. 'editingDowncast'.
	 * @private
	 */
	_setupConversion( conversionGroup ) {
		const converters = this._converters[ conversionGroup ];

		// For now we deal with editingDowncast converters only.
		// If we'll introduce upcast, we need to sniff the result of for() and check if it is a
		// DowncastHelpers or a UpcastHelpers, calling the proper helper function, accordingly.

		this.editor.conversion.for( conversionGroup ).attributeToElement( {
			model: 'word',
			view: ( modelAttributeValue, { writer } ) => {
				if ( !modelAttributeValue ) {
					return;
				}

				// Get the word type and its status from the attribute value.
				const [ , type, status ] = modelAttributeValue.match( /^([^:]+?)(?:\[(.+)])?:(.+)$/ );

				// Get the element name and eventually attribute changes from the registered converter.
				const converter = converters[ type ];

				if ( !converter ) {
					return;
				}

				// This will hold all element attributes.
				const attribs = {
					// Disable spell-checking into matched words (we don't have a case where it should be enabled).
					spellcheck: 'false'
				};

				// Append a class with the status, if any.
				if ( status ) {
					attribs[ 'data-status-' + status ] = true;
				}

				// All properties available in the match info data are converted to data attributes.
				const matchInfo = cache[ modelAttributeValue ];
				Object.entries( matchInfo.data ).forEach( ( [ key, value ] ) =>
					( attribs[ 'data-' + key ] = value ) );

				const elementName = converter( attribs );

				// Using the same priority as link for compatibility with ControlClick.
				return writer.createAttributeElement( elementName, attribs, { priority: 5 } );
			}
		} );
	}

	/**
	 * Watches for changes in the editor model, searching for words inside (or touching) those changes.
	 *
	 * @private
	 */
	_watch() {
		const editor = this.editor;
		const model = editor.model;
		const attribute = 'word';
		const finders = this._finders;

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

				for ( const change of changes ) {
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
				}

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
		 * Resets (removes) the attribute from a text range and then searches for words within it, firing their styling.
		 *
		 * @param text {String} The text to be checked.
		 * @param range {Range} The range in the model that contains the text.
		 * @param writer {Writer} Writer used to make model changes.
		 */
		function styleWordsInRange( { text, range }, writer ) {
			// Remove the attribute from the whole range first.
			writer.removeAttribute( attribute, range );

			// Enqueue the changes so they'll run independently generating changes of type
			// "attribute" when loading data. Otherwise they would be part of "insert" changes,
			// making the life of post-fixers more difficult.
			model.enqueueChange( writer.batch, writer => {
				const matches = [];

				// Run all finders over the text, accumulating all matches found in the above array.
				finders.forEach( ( { type, regex, callback } ) => {
					for ( const match of text.matchAll( regex ) ) {
						// Get a clean range, containing the word part of the match only.
						const matchRange = getWordMatchRange( match, range );

						if ( checkWordRangeValid( matchRange ) ) {
							const matchInfo = getMatchInfo( matchRange.text, type, callback );

							// If the finder didn't reject this match.
							if ( matchInfo.valid ) {
								// Save a reference to the info, so we can pass it along later in this function.
								matchRange.info = matchInfo;
								matches.push( matchRange );
							}
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
						styleMatchedWord( writer, range.text, range, range.info );
					} );
				}
			} );

			// Gets the match info data for a matched word.
			function getMatchInfo( text, type, callback ) {
				// The key used to cache the data.
				const key = type + ':' + text;

				// Try to take the match info from the cache.
				let matchInfo = cache[ key ];

				// If not in cache, create a basic info and pass it through the callback.
				if ( !matchInfo ) {
					matchInfo = {
						type,
						text,
						valid: true,

						// Properties of `data` will be included as data attributes during downcasting.
						data: {
							type
						}
					};

					const callbackReturn = callback && callback( matchInfo );
					pushIntoCache( matchInfo, callbackReturn );
				}

				return matchInfo;

				/**
				 * Complete the match info, if necessary and save it into the cache.
				 *
				 * @param matchInfo {{}} The match info.
				 * @param callbackReturn {Boolean|Promise|*} The value returned by the finder callback.
				 */
				function pushIntoCache( matchInfo, callbackReturn ) {
					// If the callback returned `false`, this is not a valid word for this finder.
					if ( callbackReturn === false ) {
						matchInfo.valid = false;
					}

					// If the callback is a promise, we need to wait for it.
					else if ( callbackReturn instanceof Promise ) {
						// Push a copy of the matchInfo so far so we'll be able to convert
						// it when unwrapping the element.
						cache[ type + '[pending]:' + text ] = cloneDeep( matchInfo );

						// Make the promise to be part of the info data.
						matchInfo.promise = callbackReturn.then( callbackReturn => {
							delete matchInfo.promise;

							// Update the cache, now that the promise resolved.
							pushIntoCache( matchInfo, callbackReturn );
						} );
					}

					// Cache it for any future request.
					cache[ key ] = matchInfo;

					// If the callback changed the text, cache it for the new text as well.
					if ( matchInfo.text && matchInfo.text !== text ) {
						const key = type + ':' + matchInfo.text;
						cache[ key ] = matchInfo;
					}
				}
			}

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
		 * @param text {String} The text matched in the model. It may differs from matchInfo.text.
		 * @param range {Range} The range encompassing the text.
		 * @param matchInfo {Object|Promise} Information about the match or a promise returned by the finder callback.
		 */
		function styleMatchedWord( writer, text, range, matchInfo ) {
			const { type, promise } = matchInfo;

			// The callback can return a promise, which will enable a second step on the attribute setting,
			// once such promise resolves.
			if ( promise ) {
				// We don't know what may happened to the model while waiting for the promise to
				// resolve, so we create a live range for the match.
				const liveMatchRange = LiveRange.fromRange( range );
				// let changed = false;
				// liveMatchRange.once( 'change:content', () => ( changed = true ) );

				promise.then( () => {
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

			const key = type + ( promise ? '[pending]:' : ':' ) + text;

			// Set the attribute to the range straight away if:
			//	- The callback returned a Promise.
			//	- Or, the text attribute remain unchanged by the callback.
			if ( promise || matchInfo.text === text ) {
				writer.setAttribute( attribute, key, range );
			} else {
				// Otherwise, the text attribute changed, so we delete the matched text and replace it.
				writer.remove( range );
				writer.insertText( matchInfo.text, { [ attribute ]: key }, range.start );

				// This change may have a cascade effect with other matchers, so we check the replacement now.
				const textFinder = new TextFinder();
				textFinder.findWordAtPosition( range.start );
				checkTexts( textFinder.texts, writer );
			}
		}

		/**
		 * Fixes the selection because it cannot have the "word" attribute otherwise it'll enlarge styled words when
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

function cloneDeep( object ) {
	return JSON.parse( JSON.stringify( object ) );
}
