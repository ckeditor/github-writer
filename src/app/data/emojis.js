/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const list = require( './emojis.json' );

const emojisObj = list.reduce( ( emojisObj, emoji ) => {
	const name = emoji.name;

	// Make a copy.
	emoji = Object.assign( {}, emoji );

	delete emoji.name;
	delete emoji.aka;

	emojisObj[ name ] = emoji;

	return emojisObj;
}, {} );

/**
 * The list of emojis in the format:
 * {
 *     "emoji name": {
 *         url: "...",
 *         unicode: "..." (undefined if no unicode available)
 *     },
 *     ...
 * }
 *
 * @type {Object}
 */
module.exports.emojis = emojisObj;

/**
 * The list of emojis in the format:
 * [
 * 		{
 * 			name: "...",
 * 			url: "...",
 * 			aka: "...", (undefined if not known as any other name)
 * 			unicode: "..." (undefined if no unicode available)
 * 		},
 * 		...
 * ]
 * @type {Object[]}
 */
module.exports.list = list;
