/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { escapeRegex } from '../util';

// Control characters used in the search source to split the entries parts.
const chars = {
	entry: '\u001d',
	record: '\u001e',
	null: '\u0000'
};

// The basic search patterns, in priority order.
const basicPatterns = [
	buildPattern( `[{E}{R}]{filter}(?:{R}.*)?{N}(.*)` ),	// full match on entry or record
	buildPattern( `{E}{filter}.*{N}(.*)` ),					// entry starts with
	buildPattern( `{R}{filter}.*{N}(.*)` ),					// record starts with
	buildPattern( `{filter}.*{N}(.*)` )						// anywhere
];

/**
 * Executes filtering queries in a list based on different, prioritized search patterns.
 */
export default class ListFilter {
	/**
	 * Creates an intance of the ListFilter class.
	 */
	constructor() {
		this._items = [];
		this._source = '';
	}

	/**
	 * Adds a searchable item to the list.
	 *
	 * @param name {String} The item main name. It has priority 1 on searches.
	 * @param [records] {String[]} Additional records of the item. They have priority 2.
	 * @param [data] {*} Any additional data to be sent back with the query results if this item is included.
	 */
	addItem( name, records, data ) {
		this._items.push( { name, records, data } );

		// Add a line in the search source string for this item in the following format (all lowercased):
		//   > {Entry Char} + Name
		//   + {Record Char} + Record (for each record)
		//   + {Null Char} + Item index in this._items
		this._source +=
			chars.entry + name.toLowerCase() +
			( records ? (
				chars.record + records.join( chars.record )
					.toLowerCase()
					.replace( /\n/g, ' ' )
			) : '' ) +
			chars.null + ( this._items.length - 1 ) +
			'\n';
	}

	/**
	 * Runs a search in the items list for the provided filter.
	 *
	 * @param filter {String} Any text used to filter the items.
	 * @returns {Object[]} The list of items found, each in the format { name, records, data }.
	 */
	query( filter ) {
		const results = [];

		filter = filter.trim().toLowerCase();

		// Return all items for an empty query.
		if ( !filter ) {
			return this._items;
		}

		// Build the final list of patterns.
		const patterns = basicPatterns.concat( [
			// Initials
			buildPattern( `\\b${ filter.split( '' ).map( char => escapeRegex( char ) ).join( '[^{R}]*\\b' ) }.*{N}(.*)` )
		] );

		// Prepare the filter to be injected in regex patterns.
		filter = escapeRegex( filter );

		// Execute all patterns.
		while ( patterns.length ) {
			// Inject the filter in the pattern.
			const pattern = patterns.shift().replace( '{filter}', filter );

			// Create the regex.
			const regex = new RegExp( pattern, 'gm' );

			// Add all matched indexes, except those already matched.
			let match;
			while ( ( match = regex.exec( this._source ) ) ) {
				if ( !results.includes( match[ 1 ] ) ) {
					results.push( match[ 1 ] );
				}
			}
		}

		// Returns a list pointing to the items in the indexes found.
		return results.map( indexString => this._items[ Number( indexString ) ] );
	}
}

/**
 * Convenience function that replace the {E|R|N} markers in the patterns with their real unicode sequences.
 *
 * @param template {String} The template to be touched.
 * @returns {String} The final template.
 */
function buildPattern( template ) {
	return template
		.replace( /{E}/g, '\\u' + chars.entry.codePointAt( 0 ).toString( 16 ).padStart( 4, '0' ) )
		.replace( /{R}/g, '\\u' + chars.record.codePointAt( 0 ).toString( 16 ).padStart( 4, '0' ) )
		.replace( /{N}/g, '\\u' + chars.null.codePointAt( 0 ).toString( 16 ).padStart( 4, '0' ) );
}
