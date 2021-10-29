/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import TreeWalker from '@ckeditor/ckeditor5-engine/src/model/treewalker';

/**
 * Moves a model position over consecutive characters.
 */
export default class TextWalker {
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
