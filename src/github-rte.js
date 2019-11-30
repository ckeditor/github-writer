/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import App from './app/app';

console.time( 'GitHub RTE loaded and ready' );

App.run()
	.then( () => {
		// TODO: Remove this at some point.
		console.timeEnd( 'GitHub RTE loaded and ready' );
	} )
	.catch( reason => {
		console.error( reason );
	} );
