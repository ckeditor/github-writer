/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export default function getMentionFeedsConfig( urls ) {
	const db = {
		issues: {
			cache: {},
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
						number: entryData.number,
						title: entryData.title
					}
				};
			},
			entryRenderer: entry => {
				const template = document.createElement( 'template' );
				template.innerHTML = `
					<div>
						<small>#${ entry.number }</small> ${ entry.title }
					</div>
				`;

				return template.content.firstElementChild;
			}
		},
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
						login: entryData.login,
						name: entryData.name
					}
				};
			},
			entryRenderer: entry => {
				const template = document.createElement( 'template' );
				template.innerHTML = `
					<div>
						${ entry.login } <small>${ entry.name }</small>
					</div>
				`;

				return template.content.firstElementChild;
			}
		},
		emoji: { cache: {} }
	};

	return [
		{
			marker: '#',
			feed: query => find( 'issues', query ),
			itemRenderer: db.issues.entryRenderer
		},
		{
			marker: '@',
			feed: query => find( 'people', query ),
			itemRenderer: db.people.entryRenderer
		},
		{
			marker: ':',
			feed: query => find( 'emoji', query ),
			itemRenderer: db.emoji.entryRenderer
		}
	];

	function find( type, query ) {
		// Normalize the query to lowercase.
		query = query.toLowerCase();

		return new Promise( ( resolve, reject ) => {
			// Try to take the results from the cache, if this query has already been made.
			if ( db[type].cache[ query ] ) {
				resolve( db[type].cache[ query ] );
				return;
			}

			getEntries( type )
				.then( entries => {
					// Cache the results.
					const results = db[type].cache[ query ] = [];

					// Got though all entries, searching for keys that include the query.
					// Fill it up until we have 5 results.
					for ( let i = 0; i < entries.length && results.length < 5; i++ ) {
						const entry = entries[ i ];
						if ( entry.key.includes( query ) ) {
							results.push( entry.data );
						}
					}

					resolve( results );
				} )
				.catch( reason => reject( reason ) );
		} );
	}

	function getEntries( type ) {
		return new Promise( ( resolve, reject ) => {
			if ( db[ type ].entries ) {
				resolve( db[ type ].entries );
				return;
			}

			downloadData( urls[ type ] )
				.then( data => {
					if ( !data ) {
						reject( new Error( 'Error when loading mentions from GitHub. No data returned.' ) );
						return;
					}
					const entries = db[ type ].entries = [];
					const entryWorker = db[ type ].entryWorker;

					data.forEach( dataEntry => {
						entries.push( entryWorker( dataEntry ) );
					} );

					resolve( entries );
				} )
				.catch( reason => reject( reason ) );
		} );
	}

	function downloadData( url ) {
		return new Promise( ( resolve, reject ) => {
			const xhr = new XMLHttpRequest();
			xhr.open( 'GET', url, true );
			xhr.responseType = 'json';
			xhr.setRequestHeader( 'Accept', 'application/json' );
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
