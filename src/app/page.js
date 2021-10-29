/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Detects page features, creates editors and setups triggers for on-demand editors injection.
 *
 * @mixes EmitterMixin
 */
export default class Page {
	/**
	 * The GitHub name for the kind of page we're in.
	 *
	 * @readonly
	 * @type {String}
	 */
	get name() {
		// The name may change dynamically on pjax enabled pages, so we recalculate it for each call with a getter.
		const meta = document.querySelector( 'meta[name="selected-link"]' );
		return meta ? meta.getAttribute( 'value' ) : 'unknown';
	}

	/**
	 * The type of GitHub page the application is running in. There are two possible types:
	 *   - "comments": pages where editors are available in a comment thread structure. This includes: issues and pull requests.
	 *   - "wiki": wiki pages editing.
	 *
	 * @readonly
	 * @type {String} Either "comments" or "wiki".
	 */
	get type() {
		return ( this.name === 'repo_wiki' ) ?
			'wiki' :
			'comments';
	}
}
