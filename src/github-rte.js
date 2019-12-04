/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * This file is the entry point of the application.
 *
 * The application runs on every page of GitHub that matches the rules specified in the extension's manifest file.
 * In those pages, the application will search for GH native markdown editors and inject CKEditor around them.
 */

/* global process */

import App from './app/app';
import { PageIncompatibilityError } from './app/util';

if ( process.env.NODE_ENV !== 'production' ) {
	console.time( 'GitHub RTE loaded and ready' );
}

App.run()
	.then( editor => {
		if ( process.env.NODE_ENV !== 'production' ) {
			console.timeEnd( 'GitHub RTE loaded and ready' );
			console.log( App.pageManager );
			console.log( editor );
		}
	} )
	.catch( reason => {
		if ( reason instanceof PageIncompatibilityError ) {
			console.warn( reason );
		} else {
			console.error( reason );
		}
	} );
