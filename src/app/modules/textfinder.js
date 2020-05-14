/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Range from '@ckeditor/ckeditor5-engine/src/model/range';
import TreeWalker from '@ckeditor/ckeditor5-engine/src/model/treewalker';

/**
 * Builds a list of text sequences that touch or are included in certain parts of the model.
 */
export default class TextFinder {
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
