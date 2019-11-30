/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import App from './app/app';
import { PageIncompatibilityError } from './app/util';

console.time( 'GitHub RTE loaded and ready' );

App.run()
	.then( () => {
		// TODO: Remove this at some point.
		console.timeEnd( 'GitHub RTE loaded and ready' );
	} )
	.catch( reason => {
		if ( reason instanceof PageIncompatibilityError ) {
			console.warn( reason );
		} else {
			console.error( reason );
		}
	} );
