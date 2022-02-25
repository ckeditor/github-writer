/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// Why CommonJS?
//
// This file will not be included as is in the build. It'll be replaced by a webpack loader (dev/static-module-loader.js).
// The loader needs to be CommonJS and it makes a require() call to this file, which, therefore, must also be CommonJS.

const linguist = require( 'linguist-languages' );

const languages = { 'Plain Text': [ 'plaintext' ] };
const aliases = { 'plaintext': 'Plain Text' };
const config = [ { language: 'plaintext', label: 'Plain Text', class: '' } ];
const searchLines = [ '>plain text,plaintext|Plain Text' ];

// Load all languages from Linguist in the above objects.
Object.values( linguist ).forEach( ( { name, aliases: languageAliases } ) => {
	const nameLower = name.toLowerCase();

	// Add the lower-cased name at the front of the aliases list.
	languageAliases = [ nameLower ].concat( languageAliases || [] );

	// Remove aliases that contain space (GH has not support for them).
	languageAliases = languageAliases.filter( alias => !/ /.test( alias ) );

	// Include this language in the list if any alias has been left.
	if ( languageAliases.length ) {
		languages[ name ] = languageAliases;

		languageAliases.forEach( alias => {
			aliases[ alias ] = name;
			config.push( { language: alias, label: name } );
		} );

		let searchKeys = nameLower !== languageAliases[ 0 ] ? [ nameLower ] : [];
		searchKeys = searchKeys.concat( languageAliases );

		searchLines.push( '>' + searchKeys.join( ',' ) + '|' + name );
	}
} );

/**
 * This helper will add the Mermaid Diagram support to the `codeBlockLanguageSelector` as it is not yet available by default
 * in `linguist-languages`. It specifies configuration, aliases, and search keywords that can be used by GH Writer `codeBlock` feature.
 *
 * languages list:  { 'Mermaid': [ 'mermaid', 'mmd' ] }
 * aliases: { 'mmd' : 'Mermaid', 'mermaid': 'Mermaid' }
 *
 */
( function supportMermaidDiagrams() {
	config.push( { language: 'mermaid', label: 'Mermaid' } );
	languages.Mermaid = [ 'mermaid', 'mmd' ];
	aliases.mmd = 'Mermaid';
	aliases.mermaid = 'Mermaid';
	searchLines.push( '>mermaid,mmd|Mermaid' );
}() );

/**
 * The list of languages available for syntax highlighting in GitHub. For example:
 * {
 *     'HTML': [ 'html', 'xhtml' ],
 *     'Java Server Pages': [ 'jsp' ],
 *     'JavaScript': [ 'javascript', 'js', 'node' ],
 *     'PHP': [ 'php', 'inc' ],
 *     ...
 * }
 *
 * @type {Object.<String, String[]>}
 */
module.exports.languages = languages;

/**
 * The list of aliases available among all languages. For example:
 * {
 *     'html': 'HTML',
 *     'xhtml': 'HTML',
 *     'jsp': 'Java Server Pages',
 *     'javascript': 'JavaScript',
 *     'js': 'JavaScript',
 *     'node': 'JavaScript',
 *     'php': 'PHP',
 *     'inc': 'PHP',
 *     ...
 * }
 *
 * @type {Object.<String, String>}
 */
module.exports.aliases = aliases;

/**
 * An array that can be used to set to the codeBlock.languages configuration containing all languages.
 *
 * @type {[{language: String, label: String, class: String}]}
 */
module.exports.config = config;

/**
 * A compiled string that is optimized to enable prioritized search using regex. It's composed by:
 *     - The ">" character followed by the lowercased language name.
 *     - The "," character followed by an alias (many).
 *     - The "|" character followed by the language name.
 *
 * @type {String}
 */
module.exports.searchSource = searchLines.join( '\n' );

/**
 * The total number of languages available.
 *
 * @type {Number}
 */
module.exports.languagesCount = Object.keys( languages ).length;
