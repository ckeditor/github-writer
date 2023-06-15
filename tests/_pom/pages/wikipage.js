/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const GitHubPage = require( '../githubpage' );
const util = require( '../util' );

/**
 * The "wiki page" page.
 */
class WikiPage extends GitHubPage {
	/**
	 * Creates an instance of the "wiki page" page.
	 *
	 * @param name {String} The name of the wiki page, as in its url.
	 */
	constructor( name ) {
		super( 'wiki/' + name );
	}

	/**
	 * Gets the HTML of this wiki page contents.
	 * @return {Promise<String>}
	 */
	async getContentHtml() {
		return await this.browserPage.evaluate( () => {
			const element = document.querySelector( '.markdown-body' );
			return element.innerHTML.replace( /^\s+|\s+$/g, '' );
		} );
	}

	/**
	 * Deletes this wiki page.
	 *
	 * @return {Promise<GitHubPage>} The page navigated after deleting (/wiki).
	 */
	async deleteWiki() {
		// Click the editor button.
		await this.browserPage.click( '.gh-header-actions :nth-child(2)' );

		// Wait for the delete button.
		await this.browserPage.waitForSelector( '.Button--danger' );

		// Click the button and confirm the alert dialog.
		await this.waitForNavigation(
			util.waitForDialog().accept(),
			this.browserPage.click( '.Button--danger' )
		);

		return await GitHubPage.getCurrentPage();
	}
}

module.exports = WikiPage;

GitHubPage.addUrlResolver( url => {
	const [ , name ] = url.match( /\/wiki\/([^/]+)$/ ) || [];

	if ( name ) {
		return new WikiPage( name );
	}
} );

