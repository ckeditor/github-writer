/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import TextWalker from './textwalker';
import Range from '@ckeditor/ckeditor5-engine/src/model/range';

/**
 * Expand a range to contain text touched by its boundaries according to a criteria.
 */
export default class TextExpander {
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
