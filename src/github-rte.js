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

// We don't want things to break.
try {
	App.run()
		.then( () => {
			if ( process.env.NODE_ENV !== 'production' ) {
				console.timeEnd( 'GitHub RTE loaded and ready' );
				console.log( App.pageManager );
			}
		} )
		.catch( reason => {
			if ( reason instanceof PageIncompatibilityError ) {
				console.warn( reason );
			} else {
				console.error( reason );
			}
		} )
		.finally( () => {
			// Add this class to body so we turn off invasive initialization styles.
			setTimeout( () => {
				document.body.classList.add( 'github-rte-loaded' );
			}, 0 );
		} );
} catch ( error ) {
	// It is very important to add this class, so we disable any bootstrapping CSS that we included on load.
	document.body.classList.add( 'github-rte-loaded' );

	// In production, do no "break-break", just "kinda break".
	if ( process.env.NODE_ENV === 'production' ) {
		console.error( error );
	} else {
		throw error;
	}
}
