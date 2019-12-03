/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global process */

import App from './app/app';
import { PageIncompatibilityError } from './app/util';

if ( process.env.NODE_ENV !== 'production' ) {
	console.time( 'GitHub RTE loaded and ready' );
}

App.run()
	.then( () => {
		if ( process.env.NODE_ENV !== 'production' ) {
			console.timeEnd( 'GitHub RTE loaded and ready' );
		}
	} )
	.catch( reason => {
		if ( reason instanceof PageIncompatibilityError ) {
			console.warn( reason );
		} else {
			console.error( reason );
		}
	} );
