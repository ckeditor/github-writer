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

				return {
					key,
					data: {
						icon: entryLiElement.querySelector( 'g-emoji' ).textContent,
						name: entryLiElement.getAttribute( 'data-emoji-name' )
					}
				};
			},
			entryRenderer: entry => {
				const template = document.createElement( 'template' );
				template.innerHTML = `
					<div>
						<g-emoji>${ entry.icon }</g-emoji> <small>${ entry.name }</small>
					</div>
				`;

				return template.content.firstElementChild;
			}
		}
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
			if ( db[ type ].cache[ query ] ) {
				resolve( db[ type ].cache[ query ] );
				return;
			}

			getEntries( type )
				.then( entries => {
					// Cache the results.
					const results = db[ type ].cache[ query ] = [];

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

			downloadData( urls[ type ], [ 'issues', 'people' ].includes( type ) )
				.then( data => {
					if ( !data ) {
						reject( new Error( 'Error when loading mentions from GitHub. No data returned.' ) );
						return;
					}

					// Emojis don't come as JSON but HTML ul>li list. The worker expects the li elements.
					if ( type == 'emoji' ) {
						const root = document.createElement( 'template' );
						root.innerHTML = data;
						data = Array.from( root.content.firstElementChild.getElementsByTagName( 'li' ) );
					}

					const entryWorker = db[ type ].entryWorker;

					const entries = db[ type ].entries = data.reduce( ( entries, dataEntry ) => {
						const entry = entryWorker( dataEntry );

						// Workers can return falsy to ignore an entry.
						if ( entry ) {
							entries.push( entry );
						}

						return entries;
					}, [] );

					resolve( entries );
				} )
				.catch( reason => reject( reason ) );
		} );
	}

	function downloadData( url, json ) {
		return new Promise( ( resolve, reject ) => {
			const xhr = new XMLHttpRequest();
			xhr.open( 'GET', url, true );

			if ( json ) {
				xhr.responseType = 'json';
				xhr.setRequestHeader( 'Accept', 'application/json' );
			}

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
