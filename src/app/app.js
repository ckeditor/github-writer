/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import PageManager from './pagemanager';

/**
 * Controls the application execution.
 */
export default class App {
	/**
	 * Runs the application in the page.
	 *
	 * The job of the application can be defined in this few steps:
	 *   1. Find the main markdown editor available in the page, if any, and inject a RTE editor around it.
	 *   2. Setup triggers in the page so RTE editors are created on demand (e.g. when editing comments).
	 *   3. Quit silently, letting the editor do its job.
	 *
	 * Just a single call to run is allowed. Any subsequent call will result in error. Without any interference in the page.
	 *
	 * @returns {Promise<Editor>} A promise which resolves once the main editor injected in the page is ready.
	 */
	static run() {
		// Control if run() has been already called earlier.
		if ( App.pageManager ) {
			throw new Error( 'The application is already running.' );
		}

		App.pageManager = new PageManager();

		// Setups the main editor available in the page, if any.
		const promise = App.pageManager.setupMainEditor();

		// Check if the promise has been rejected during the above attempt, due to error.
		let rejected;
		promise.catch( () => {
			rejected = true;
		} );

		// Do not touch the page further if any error happened.
		if ( !rejected ) {
			// Setup the comment "Edit" buttons, if any.
			App.pageManager.setupEdit();
			App.pageManager.setupQuoteSelection();
		}

		return promise;
	}
}
