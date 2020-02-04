/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Range from '@ckeditor/ckeditor5-engine/src/model/range';
import LiveRange from '@ckeditor/ckeditor5-engine/src/model/liverange';
import TreeWalker from '@ckeditor/ckeditor5-engine/src/model/treewalker';

import { createElementFromHtml } from '../util';

export default class AutoLinking extends Plugin {
	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const linkDataLoader = new GitHubLinkDataLoader();

		const autolink = new AutoLinkStyler( editor );

		// @user-name
		// @organization/user-name
		autolink.addPattern(
			/@(?:[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+(?:\/[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+)?)/i,
			'person',
			githubLinkCallback );

		// #1
		// mojombo#1
		// mojombo/github-flavored-markdown#1
		autolink.addPattern(
			/(?:[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+(?:\/[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+)?)?#\d+/i,
			'issue',
			githubLinkCallback );

		// 16c999e8c71134401a78d4d46435517b2271d6ac
		// mojombo@16c999e8c71134401a78d4d46435517b2271d6ac
		// mojombo/github-flavored-markdown@16c999e8c71134401a78d4d46435517b2271d6ac
		autolink.addPattern(
			/(?:[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+(?:\/[a-z\d](?:[a-z\d]|-(?=[a-z\d]))+)?@)?[a-f\d]{7,40}/i,
			'sha',
			githubLinkCallback );

		// GitHub urls
		autolink.addPattern(
			/https:\/\/github\.com\/.*\/(?:issues|pull)\/.+/i,
			'issue',
			githubLinkCallback );
		autolink.addPattern(
			/https:\/\/github\.com\/.*\/commit\/.+/i,
			'sha',
			githubLinkCallback );

		// Other urls
		autolink.addPattern(
			// eslint-disable-next-line max-len
			/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[A-Z0-9+&@#/%=~_|$])/i,
			'url' );

		function githubLinkCallback( attribs ) {
			const linkData = linkDataLoader.load( attribs.type, attribs.text );

			if ( linkData ) {
				if ( linkData instanceof Promise ) {
					return linkData;
				} else {
					Object.assign( attribs, linkData );
				}
			}

			return linkData !== false;
		}
	}
}

/**
 * Watches for text patterns during changes in the editor and applies the "autolink" attribute to matching words.
 */
class AutoLinkStyler {
	constructor( editor ) {
		// Schema and conversion.
		{
			editor.model.schema.extend( '$text', { allowAttributes: 'autolink' } );
			editor.model.schema.setAttributeProperties( 'autolink', {
				isFormatting: false,
				copyOnEnter: false
			} );

			editor.conversion.for( 'editingDowncast' ).attributeToElement( {
				model: 'autolink',
				view: ( modelValue, viewWriter ) => {
					let attribs;

					if ( modelValue ) {
						attribs = {
							spellcheck: 'false'
						};

						Object.keys( modelValue ).forEach( name => ( attribs[ 'data-' + name ] = modelValue[ name ] ) );
					}

					return viewWriter.createAttributeElement( 'autolink', attribs );
				}
			} );
		}

		this._matchStyle = new WordMatchStyler( 'autolink' );
		this._matchStyle.watch( editor );
	}

	addPattern( pattern, type, callback ) {
		this._matchStyle.addMatcher( pattern, attributes => {
			attributes.type = type;

			return !callback || callback( attributes );
		} );
	}
}

/**
 * Keep a desired attribute applied to all (and only to) occurrences of matched words in the document.
 */
class WordMatchStyler {
	constructor( attribute ) {
		this.attribute = attribute;
		this._matchers = [];
	}

	addMatcher( pattern, callback ) {
		const flags = pattern.flags.replace( /g/, '' );
		const regex = new RegExp( `([ "'(]|^)(${ pattern.source })(?=(?: |[ "'.,;)?!](?: |$))|$)`, flags );
		const regexGlobal = new RegExp( regex.source, flags + 'g' );

		this._matchers.push( { regex, regexGlobal, callback } );
	}

	watch( editor ) {
		const model = editor.model;

		const attribute = this.attribute;
		const matchers = this._matchers;

		// Watch for changes.
		watchChanges();

		// Fix selection.
		fixSelection();

		function watchChanges() {
			model.document.registerPostFixer( writer => {
				const changes = model.document.differ.getChanges();

				if ( changes.length ) {
					const textFinder = new TextFinder();

					changes.forEach( change => {
						switch ( change.type ) {
							case 'attribute': {
								if ( change.attributeKey !== attribute ) {
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

								textFinder.findInRange( range );
								break;
							}
							case 'remove': {
								textFinder.findWordAtPosition( change.position );
								break;
							}
						}
					} );

					checkTexts( textFinder.texts, writer );
				}
			} );
		}

		function checkTexts( texts ) {
			texts.forEach( styleWordsInRange );
		}

		function styleWordsInRange( { text, range } ) {
			model.enqueueChange( 'transparent', writer => {
				const matches = [];

				// Remove the attribute from the whole range first.
				writer.removeAttribute( attribute, range );

				// Run all matchers over the text, accumulating all matches found in the above array.
				matchers.forEach( ( { regexGlobal, callback } ) => {
					for ( const match of text.matchAll( regexGlobal ) ) {
						const matchRange = getWordMatchRange( match, range );

						if ( checkWordRangeValid( matchRange ) ) {
							matchRange.callback = callback;
							matches.push( matchRange );
						}
					}
				} );

				if ( matches.length ) {
					// Remove ranges that are intersecting (just one matcher on the whole word).
					matches.forEach( ( range, index ) => {
						while ( ++index < matches.length ) {
							if ( range.isIntersecting( matches[ index ] ) ) {
								delete matches[ index ];
							}
						}
					} );

					// Finally, style every word found.
					matches.forEach( range => {
						styleMatchedWord( writer, range.text, range, range.callback );
					} );
				}
			} );
		}

		function styleMatchedWord( writer, matchText, matchRange, matcherCallback ) {
			const attribs = { text: matchText };
			const callbackReturn = matcherCallback( attribs );

			if ( callbackReturn instanceof Promise ) {
				// We don't know what may happened to the model while waiting for the promise to
				// resolve, so we create a live range for the match.
				const liveMatchRange = LiveRange.fromRange( matchRange );
				callbackReturn.then( () => {
					// To play safe, we don't care about any return value from the promise and
					// instead, check again the texts touched by the boundaries of the range.
					// If nothing change, the same word will be checked and this time we expect
					// a non promise to be returned by the callback.
					const textFinder = new TextFinder();
					textFinder.findWordAtPosition( liveMatchRange.start );
					textFinder.findWordAtPosition( liveMatchRange.end );

					liveMatchRange.detach();

					checkTexts( textFinder.texts );
				} );
			}

			attribs.enabled = ( callbackReturn !== false );

			if ( !callbackReturn || callbackReturn instanceof Promise || attribs.text === matchText ) {
				writer.setAttribute( attribute, attribs, matchRange );
			} else {
				writer.remove( matchRange );
				writer.insertText( attribs.text, { [ attribute ]: attribs }, matchRange.start );

				const textFinder = new TextFinder();
				textFinder.findWordAtPosition( matchRange.start );
				checkTexts( textFinder.texts );
			}
		}

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
			wordRange.text = text;

			return wordRange;
		}

		function checkWordRangeValid( range ) {
			const nodes = Array.from( range.getItems() );
			let valid = true;

			if ( nodes.length > 1 ) {
				const attribs = Array.from( nodes.shift().getAttributeKeys() )
					.filter( attribute => model.schema.getAttributeProperties( attribute ).isFormatting );

				valid = !nodes.find( node => {
					const otherAttribs = Array.from( node.getAttributeKeys() )
						.filter( attribute => model.schema.getAttributeProperties( attribute ).isFormatting );

					return otherAttribs.length !== attribs.length ||
						otherAttribs.find( otherAttrib => !attribs.includes( otherAttrib ) );
				} );
			}

			return valid;
		}

		function fixSelection() {
			// The selection cannot have the styler attribute otherwise it'll enlarge styled words
			// when typing space at the end of them.

			const selection = model.document.selection;

			selection.on( 'change:range', checkSelection );
			selection.on( 'change:attribute', checkSelection );

			function checkSelection() {
				if ( selection.hasAttribute( attribute ) ) {
					const pos = selection.anchor;
					// We don't want to remove the attribute when inside the text node but when over its boundaries.
					if ( !pos.textNode ) {
						model.change( writer => {
							writer.removeSelectionAttribute( attribute );
						} );
					}
				}
			}
		}
	}
}

/**
 * Builds a list of text sequences that touch certain model positions.
 */
class TextFinder {
	constructor() {
		this.texts = [];
	}

	findWordAtPosition( pos ) {
		const range = getWordRangeFromPosition( pos );

		if ( range ) {
			if ( !this.texts.find( item => {
				return item.range.isEqual( range );
			} ) ) {
				this.texts.push( {
					text: Array.from( range.getItems() )
						.reduce( ( output, item ) => ( output + item.data ), '' ),
					range
				} );
			}
		}

		function getWordRangeFromPosition( pos ) {
			let startPos, endPos;
			{
				const walker = new TreeWalker( {
					direction: 'backward',
					startPosition: pos,
					singleCharacters: true
				} );
				walker.skip( value => {
					return value.type === 'text' && value.item.data !== ' ';
				} );

				startPos = walker.position;
			}

			{
				const walker = new TreeWalker( {
					direction: 'forward',
					startPosition: pos,
					singleCharacters: true
				} );
				walker.skip( value => {
					return value.type === 'text' && value.item.data !== ' ';
				} );

				endPos = walker.position;
			}

			if ( !startPos.isEqual( endPos ) ) {
				return new Range( startPos, endPos );
			}
		}
	}

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
					.reduce( ( text, textNode ) => ( text += textNode.data ), '' );

				this.texts.push( { text, range: textRange } );
			}
		}
	}
}

/**
 * Expand a range to contain text touched by its boundaries according to a criteria.
 */
class TextExpander {
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
	 * @param range
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
class TextWalker {
	constructor( options = { direction: 'forward' } ) {
		this._walker = new TreeWalker( {
			direction: options.direction,
			startPosition: options.startPosition,
			singleCharacters: true
		} );
	}

	get position() {
		return this._walker.position;
	}

	static word( position, direction = 'forward' ) {
		const charWalker = new TextWalker( {
			direction,
			startPosition: position,
			singleCharacters: true
		} );

		const boundaryTester = ( direction === 'forward' ? /[.,;:?!]/ : /[¿¡]/ );

		let char;
		while ( ( char = charWalker.char() ) ) {
			if ( /\s/.test( char ) ) {
				break;
			}

			if ( boundaryTester.test( char ) ) {
				continue;
			}

			position = charWalker.position;
		}

		return position;
	}

	char() {
		let char;
		this._walker.skip( value => ( !char && value.type === 'text' && !!( char = value.item.data ) ) );
		return char;
	}
}

class GitHubLinkDataLoader {
	constructor() {
		this.cache = {};
	}

	getPreviewUrlInfo() {
		if ( !this._urlInfo ) {
			const urlElement = document.querySelector( '[data-preview-url]' );
			const tokenElement = urlElement && urlElement.querySelector( 'input.js-data-preview-url-csrf' );

			if ( tokenElement ) {
				this._urlInfo = {
					url: urlElement.getAttribute( 'data-preview-url' ),
					token: tokenElement.value
				};
			}
		}

		return this._urlInfo;
	}

	load( type, text ) {
		const key = type + ':' + text;
		if ( !this.cache.hasOwnProperty( key ) ) {
			const checkPreview =
				type === 'issue' ||
				type === 'sha' ||
				type === 'person' ||
				( type === 'url' && /^https:\/\/github.com\//i.test( text ) );

			if ( checkPreview ) {
				// TODO: handle promise rejection.
				this.cache[ key ] = new Promise( resolve => {
					return downloadPreview.call( this )
						.then( container => {
							const link = container.querySelector( 'a' );
							let linkData;

							if ( link ) {
								linkData = {
									url: link.getAttribute( 'href' ),
									text: link.textContent,
									'hovercard-type': link.getAttribute( 'data-hovercard-type' ),
									'hovercard-url': link.getAttribute( 'data-hovercard-url' )
								};

								if ( linkData.text !== text ) {
									this.cache[ type + ':' + linkData.text ] = linkData;
								}
							} else {
								linkData = false;
							}

							// The cache now points to the data itself, not to the promise anymore.
							this.cache[ key ] = linkData;

							resolve( linkData );
						} );
				} );
			} else {
				this.cache[ key ] = { text };
			}
		}

		return this.cache[ key ];

		function downloadPreview() {
			return new Promise( ( resolve, reject ) => {
				// noinspection JSPotentiallyInvalidUsageOfClassThis
				const urlInfo = this.getPreviewUrlInfo();

				const xhr = new XMLHttpRequest();
				xhr.open( 'POST', urlInfo.url, true );

				// It doesn't work without this one.
				xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );

				xhr.addEventListener( 'error', () => reject(
					new Error( `Error loading preview for auto-linking from ${ urlInfo.url }.` ) ) );
				xhr.addEventListener( 'abort', () => reject() );
				xhr.addEventListener( 'load', () => {
					resolve( createElementFromHtml( `<div>${ xhr.response }</div>` ) );
				} );

				const data = new FormData();
				data.append( 'text', text );
				data.append( 'authenticity_token', urlInfo.token );

				xhr.send( data );
			} );
		}
	}
}
