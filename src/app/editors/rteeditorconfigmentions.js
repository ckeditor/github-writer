/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createElementFromHtml } from '../util';

/**
 * Builds the CKEditor configuration for mentions as well as their implementation.
 *
 * @param {Object} urls The urls to be used to retrieve mentions data. Format { feed_type: 'url', ... }
 * @returns {Object} A mentions configuration object.
 */
export default function getMentionFeedsConfig( urls ) {
	// Hold the state and implementation of the feeds in this object.
	// Note that this is a singleton, shared by all editors available in the page.
	// TODO: Maybe generalize this API into an editor plugin? Maybe part of the official mentions?
	const db = {
		/**
		 * A mention feed.
		 *
		 * @interface mentionFeed
		 */
		issues: {
			/**
			 * All downloaded and preprocessed entries available for this feed.
			 *
			 * @type {Object}
			 */
			entries: null,		// Defined here just for documentation purpose.

			/**
			 * The cache used by this feed. In this way, feed items are filtered and retrieved faster.
			 *
			 * @type {Object}
			 */
			cache: {},

			/**
			 * Manipulates every entry from the data received by xhr from GH into a clean,
			 * preprocessed format used by our code.
			 *
			 * The expected object returned by this method should have this format, at least:
			 *   {
			 *       key: {String},     // Unique. The text used when filtering the entries.
			 *       data: {
			 *           id: {String},  // The string to be inserted in the editor. It must start with the mention marker (e.g. '#123').
			 *           ...            // Any other property, usually necessary for the entryRendered() job.
			 *       }
			 *   }
			 *
			 * @param {*} entryData A single entry from the data received from GH in raw format.
			 * @returns {Object} An object representation of the data in the format expected by our code.
			 */
			entryWorker: entryData => {
				/*
					entryData = [
						{
							id: [Number],		// Unique issue id in the whole GH.
							number: [Number],	// Issue id in the repo.
							title: [String]		// Issue title.
						},
						...
					]
				*/

				const titleLow = entryData.title.toLowerCase();

				// The search key is a string in the format "id title_lowercase title_initials_lowercase".
				const key =
					entryData.number + ' ' +
					titleLow + ' ' +
					titleLow.match( /\b\w/g ).join( '' );	// All initials.

				return {
					key,
					data: {
						id: '#' + entryData.number,
						number: entryData.number,
						title: entryData.title
					}
				};
			},

			/**
			 * Renders the entries displayed in the mentions selection box.
			 *
			 * This method passed to the CKEditor configuration as a standalone function.
			 *
			 * @param {Object} entry The entry to be rendered, in the format returned by entryWorker().
			 * @returns {HTMLElement} The element to be inserted in the selection box list.
			 */
			entryRenderer: entry => {
				const template = document.createElement( 'template' );
				template.innerHTML = `
					<button>
						<small>#${ entry.number }</small> ${ entry.title }
					</button>
				`;

				return template.content.firstElementChild;
			}
		},

		/**
		 * @implements {mentionFeed}
		 */
		people: {
			cache: {},
			entryWorker: entryData => {
				/*
					entryData = [
						{
							type: [String]
							id: [Number],		// Unique person id in the whole GH.
							login: [Number],	// User login name.
							name: [String]		// User name.
						},
						...
					]
				*/

				const loginLow = entryData.login.toLowerCase();
				const nameLow = entryData.name.toLowerCase();

				// The search key is a string in the format "id title_lowercase title_initials_lowercase".
				const key =
					loginLow + ' ' +
					nameLow + ' ' +
					nameLow.match( /\b\w/g ).join( '' );	// All initials.

				return {
					key,
					data: {
						id: '@' + entryData.login,
						login: entryData.login,
						name: entryData.name
					}
				};
			},
			entryRenderer: entry => {
				const template = document.createElement( 'template' );
				template.innerHTML = `
					<button>
						${ entry.login } <small>${ entry.name }</small>
					</button>
				`;

				return template.content.firstElementChild;
			}
		},

		/**
		 * @implements {mentionFeed}
		 */
		emoji: {
			cache: {},
			entryWorker: entryLiElement => {
				/*
				<li id="emoji-grinning" data-value=":grinning:" data-emoji-name="grinning" data-text="grinning smile happy">
					<g-emoji>😀</g-emoji> grinning
				</li>

				// TODO: GH offers some non-unicod emojis as well, with the following format. This is not supported for now.
				<li role="option" id="emoji-trollface" data-value=":trollface:" data-emoji-name="trollface" data-text="trollface">
          			<img class="emoji emoji-result" height="20" width="20" align="absmiddle" alt=":trollface:"
          				src="https://github.githubassets.com/images/icons/emoji/trollface.png">
					trollface
				</li>
				*/

				// Do nothing for non-unicode emojis.
				if ( !entryLiElement.querySelector( 'g-emoji' ) ) {
					return;
				}

				const text = entryLiElement.getAttribute( 'data-text' );

				// The search key is a string in the format "id title_lowercase title_initials_lowercase".
				const key =
					text + ' ' +
					text.match( /\b\w/g ).join( '' );	// All initials.

				const icon = entryLiElement.querySelector( 'g-emoji' ).textContent;
				const name = entryLiElement.getAttribute( 'data-emoji-name' );

				return {
					key,
					data: {
						// TODO: Show the icon to the user, instead of the ":name:". CKEditor forces the id to start with the marker.
						id: ':' + name + ':',
						icon,
						name
					}
				};
			},
			entryRenderer: entry => {
				const template = document.createElement( 'template' );
				// <g-emoji> is a GH element. We're borrowing some of its styles.
				template.innerHTML = `
					<button>
						<g-emoji>${ entry.icon }</g-emoji> ${ entry.name }
					</button>
				`;

				return template.content.firstElementChild;
			}
		}
	};

	// Returns the CKEditor compatible configuration of the feeds.
	const config = [];

	// Add just those available in the url list received.
	{
		urls.issues && config.push( {
			marker: '#',
			feed: query => find( 'issues', query ),
			itemRenderer: db.issues.entryRenderer
		} );

		urls.people && config.push( {
			marker: '@',
			feed: query => find( 'people', query ),
			itemRenderer: db.people.entryRenderer
		} );

		urls.emoji && config.push( {
			marker: ':',
			feed: query => find( 'emoji', query ),
			itemRenderer: db.emoji.entryRenderer
		} );
	}

	return config;

	// Gets a short list of entries of a given type, filtered by the provided query.
	//
	// @param {String} type The type of entries.
	// @param {String} query The filtering substring query.
	// @returns {Promise<Array>} A promise that resolves with a short list of entries.
	function find( type, query ) {
		// Normalize the query to lowercase.
		query = query.toLowerCase();

		return new Promise( ( resolve, reject ) => {
			// Try to take the results from the cache, if this query has already been made.
			if ( db[ type ].cache[ query ] ) {
				resolve( db[ type ].cache[ query ] );
				return;
			}

			// Get all entries available for this feed type.
			getEntries( type )
				.then( entries => {
					// Put the results in the cache.
					const results = db[ type ].cache[ query ] = [];

					// Got though all entries, searching for keys that include the query substring.
					// Fill it up until we have 5 results (just like GH).
					for ( let i = 0; i < entries.length && results.length < 5; i++ ) {
						const entry = entries[ i ];

						// There is not much logic during filtering other then a substring search.
						// Pre-processing in {mentionFeed#entryWorker} already figured the searching cases.
						if ( entry.key.includes( query ) ) {
							results.push( entry.data );
						}
					}

					resolve( results );
				} )
				// Do not break, just let CKEditor know that it didn't work.
				.catch( reason => reject( reason ) );
		} );
	}

	// Gets the preprocessed full list of entries of a given type.
	//
	// In this function, the raw data is received from GH and broken into entries that are
	// then passed to {mentionFeed#entryWorker()} for processing.
	//
	// @param {String} type The type of entries.
	// @returns {Promise<Array>} A promise that resolves with the preprocessed, full list of entries.
	function getEntries( type ) {
		return new Promise( ( resolve, reject ) => {
			// If the entries have already been downloaded and processed, just return them straight.
			if ( db[ type ].entries ) {
				resolve( db[ type ].entries );
				return;
			}

			// Download the mentions data from GH.
			downloadData( urls[ type ], [ 'issues', 'people' ].includes( type ) )
				.then( data => {
					if ( !data ) {
						reject( new Error( 'Error when loading mentions from GitHub. No data returned.' ) );
						return;
					}

					// The returned data is either an array of objects, each being an entry or, in the case of emojis,
					// a HTML ul>li list. In such a case, the worker implementation expects the li elements.
					if ( type === 'emoji' ) {
						const root = createElementFromHtml( data );
						data = Array.from( root.getElementsByTagName( 'li' ) );
					}

					// Take the worker that will preprocess every item received.
					const entryWorker = db[ type ].entryWorker;

					// Instead of map(), we use reduce() so workers can ignore entries, if necessary.
					const entries = db[ type ].entries = data.reduce( ( entries, dataEntry ) => {
						// Let the worker do its job.
						const entry = entryWorker( dataEntry );

						// Workers can return falsy to ignore an entry.
						if ( entry ) {
							entries.push( entry );
						}

						return entries;
					}, [] ); 	// Pass to reduce() the initial state of the return value -> an empty array.

					resolve( entries );
				} )
				// Do not break, just let CKEditor know that it didn't work.
				.catch( reason => reject( reason ) );
		} );
	}

	// Download the raw feed data from the specified url.
	// @param {String} url The endpoint from which download data.
	// @param {Boolean} json Whether the expected response is json.
	// @returns {Promise<String>} A promise that with the raw response data.
	function downloadData( url, json ) {
		return new Promise( ( resolve, reject ) => {
			const xhr = new XMLHttpRequest();
			xhr.open( 'GET', url, true );

			if ( json ) {
				xhr.responseType = 'json';
				xhr.setRequestHeader( 'Accept', 'application/json' );
			}

			// It doesn't work without this one.
			xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );

			xhr.addEventListener( 'error', () => reject( new Error( `Error loading mentions from $(url).` ) ) );
			xhr.addEventListener( 'abort', () => reject() );
			xhr.addEventListener( 'load', () => {
				resolve( xhr.response );
			} );

			xhr.send();
		} );
	}
}
