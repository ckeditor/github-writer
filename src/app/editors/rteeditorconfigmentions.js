/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createElementFromHtml, escapeHtml, getInitials, openXmlHttpRequest } from '../util';

const RteEditorConfigMentions = {
	/**
	 * Builds the CKEditor configuration for mentions as well as their implementation.
	 *
	 * @param {Object} urls The urls to be used to retrieve mentions data. Format { feed_type: 'url', ... }
	 * @returns {Object} A mentions configuration object.
	 */
	get: urls => {
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
				 * Gets the list of entries to be passed to entryWorker() from the original data loaded from GitHub.
				 *
				 * @param data {Object|String} The raw data.
				 * @returns {Array} The list of entries.
				 */
				getEntriesFromData( data ) {
					return data.suggestions;
				},

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

					return {
						keys: {
							id: entryData.number.toString(),
							text: entryData.number + titleLow + getInitials( titleLow )
						},
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
					return createElementFromHtml( `
						<button>
							<small>#${ entry.number }</small> ${ escapeHtml( entry.title ) }
						</button>
					` );
				}
			},

			/**
			 * @implements {mentionFeed}
			 */
			people: {
				cache: {},

				getEntriesFromData( data ) {
					return data;
				},

				entryWorker: entryData => {
					/*
						entryData = [
							{
								type: [String]		// "user" | "team"
								id: [Number],		// Unique person id in the whole GH.

								// For "user"
								login: [String],	// User login name.
								name: [String]		// User name.

								// For "team"
								name: [String],			// Team name.
								description: [String]	// Description.
							},
							...
						]
					*/

					let name, description;

					if ( entryData.type === 'user' ) {
						name = entryData.login;
						description = entryData.name || '';
					} else if ( entryData.type === 'team' ) {
						name = entryData.name;
						description = entryData.description || '';
					} else {
						return;
					}

					if ( !name ) {
						return;
					}

					const nameLow = name && name.toLowerCase();
					const descriptionLow = description && description.toLowerCase();

					return {
						keys: {
							id: nameLow,
							text: nameLow + descriptionLow + getInitials( descriptionLow )
						},
						data: {
							id: '@' + name,
							name,
							description
						}
					};
				},
				entryRenderer: entry => {
					return createElementFromHtml( `
						<button>
							${ escapeHtml( entry.name ) } <small>${ escapeHtml( entry.description ) }</small>
						</button>
					` );
				}
			},

			/**
			 * @implements {mentionFeed}
			 */
			emoji: {
				cache: {},

				getEntriesFromData( data ) {
					return data;
				},

				entryWorker: entryData => {
					/*
						entryData = [
							{
								name: [String],
								url: [String],
								aka: [String], (optional)
								unicode: [String] (optional)
							},
							...
						]
					*/

					const name = entryData.name;
					const aka = entryData.aka;

					return {
						keys: {
							id: name,
							text: aka ? ( name + ' ' + aka ) : name
						},
						data: {
							id: ':' + name + ':',
							name,
							url: entryData.url,
							unicode: entryData.unicode
						}
					};
				},
				entryRenderer: entry => {
					let icon;

					if ( entry.unicode ) {
						// eslint-disable-next-line max-len
						icon = `<g-emoji alias="${ entry.name }" fallback-src="${ entry.url }" class="emoji-result" tone="0">${ entry.unicode }</g-emoji>`;
					} else {
						// eslint-disable-next-line max-len
						icon = `<img class="emoji emoji-result" height="20" width="20" align="absmiddle" alt=":${ entry.name }:" src="${ entry.url }">`;
					}
					return createElementFromHtml( `
						<button>
							${ icon } ${ entry.name }
						</button>
					` );
				}
			}
		};

		// Returns the CKEditor compatible configuration of the feeds.
		const config = [];

		// Add just those available in the url list received.
		{
			urls.issues && config.push( {
				marker: '#',
				feed( query ) {
					return find.call( this, 'issues', query );
				},
				itemRenderer: db.issues.entryRenderer
			} );

			urls.people && config.push( {
				marker: '@',
				feed( query ) {
					return find.call( this, 'people', query );
				},
				itemRenderer: db.people.entryRenderer
			} );

			urls.emoji && config.push( {
				marker: ':',
				feed( query ) {
					return find.call( this, 'emoji', query );
				},
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
			// Mentions should not be enabled inside code (#30). This should be handled by the mentions plugin itself,
			// but it's not, so we do a workaround here.
			// `this` in feed functions point to `editor`.
			if ( ( this.commands.get( 'code' ) && this.commands.get( 'code' ).value ) ||
				( this.commands.get( 'codeBlock' ) && this.commands.get( 'codeBlock' ).value ) ) {
				return Promise.resolve( [] );
			}

			// Normalize the query to lowercase.
			query = query.toLowerCase();

			// Try to take it from the cache, if this query has already been requested.
			let promise = db[ type ].cache[ query ];

			if ( !promise ) {
				// Get all entries available for this feed type.
				promise = db[ type ].cache[ query ] = getEntries( type )
					.then( entries => {
						const results = [];

						// Got though all entries, searching for keys that include the query substring.
						// Fill it up until we have 5 results (just like GH).

						// If the query is empty, we don't search by id and default to the first 5 entries of byText.
						if ( query ) {
							const entriesById = entries.byId;
							for ( let i = 0; i < entriesById.length && results.length < 5; i++ ) {
								const entry = entriesById[ i ];

								if ( entry.key.startsWith( query ) && !results.includes( entry.data ) ) {
									results.push( entry.data );
								}
							}
						}

						const entriesByText = entries.byText;
						for ( let i = 0; i < entriesByText.length && results.length < 5; i++ ) {
							const entry = entriesByText[ i ];

							if ( entry.key.includes( query ) && !results.includes( entry.data ) ) {
								results.push( entry.data );
							}
						}

						return results;
					} );
			}

			return promise;
		}

		// Gets the preprocessed full list of entries of a given type.
		//
		// In this function, the raw data is received from GH and broken into entries that are
		// then passed to {mentionFeed#entryWorker()} for processing.
		//
		// @param {String} type The type of entries.
		// @returns {Promise<Array>} A promise that resolves with the preprocessed, full list of entries.
		function getEntries( type ) {
			// If the entries have already been downloaded and processed, just return them straight.
			let promise = db[ type ].entries;

			if ( !promise ) {
				// Download the mentions data from GH.
				promise = db[ type ].entries = downloadData( urls[ type ] )
					.then( data => {
						if ( !data ) {
							throw new Error( 'Error when loading mentions from GitHub. No data returned.' );
						}

						// Take the worker that will preprocess every item received.
						const entryWorker = db[ type ].entryWorker;
						const entries = {
							byId: [],
							byText: []
						};

						db[ type ].getEntriesFromData( data ).forEach( dataEntry => {
							// Let the worker do its job.
							const entry = entryWorker( dataEntry );

							// Workers can return falsy to ignore an entry.
							if ( entry ) {
								entries.byId.push( {
									key: String( entry.keys.id ).toLowerCase(),
									data: entry.data
								} );

								entries.byText.push( {
									key: String( entry.keys.text ).toLowerCase(),
									data: entry.data
								} );
							}
						} );

						// The first list should be matched with 1:1 priority, so we sort it alphabetically.
						entries.byId = entries.byId.sort( ( x, y ) =>
							x.key.localeCompare( y.key, undefined, { sensitivity: 'base' } ) );

						return entries;
					} );
			}

			return promise;
		}

		// Download the raw feed data from the specified url.
		// @param {String} url The endpoint from which download data.
		// @param {Boolean} json Whether the expected response is json.
		// @returns {Promise<String>} A promise that with the raw response data.
		function downloadData( url ) {
			return new Promise( ( resolve, reject ) => {
				if ( typeof url !== 'string' ) {
					resolve( url );
				}

				const xhr = openXmlHttpRequest( url, 'GET' );

				xhr.responseType = 'json';
				xhr.setRequestHeader( 'Accept', 'application/json' );

				xhr.addEventListener( 'error', () => reject( new Error( `Error loading mentions from $(url).` ) ) );
				xhr.addEventListener( 'abort', () => reject() );
				xhr.addEventListener( 'load', () => {
					resolve( xhr.response );
				} );

				xhr.send();
			} );
		}
	}
};

export default RteEditorConfigMentions;
