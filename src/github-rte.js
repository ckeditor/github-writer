/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import App from './app/app';

const startTime = new Date();

App.run()
	.then( () => {
		// TODO: Remove this at some point.
		console.log( 'GitHub RTE loaded and ready. Running time: ' + ( new Date() - startTime ) + 'ms.' );
	} )
	.catch( reason => {
		console.error( reason );
	} );
