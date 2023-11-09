/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const NewIssuePage = require( '../_pom/pages/newissuepage' );

const { expect } = require( 'chai' );
const htmlToJson = require( 'html-to-json' );

describe( 'Issue - New', function() {
	this.timeout( 0 );
	const root = 'form#new_issue';
	let page;

	before( async () => {
		page = await NewIssuePage.getPage();
	} );

	describe( 'Dom', () => {
		Object.entries( {
			// Editor
			root,
			'toolbar': root + ' markdown-toolbar',
			'textarea': root + ' textarea',
			'tab -> write': root + ' .write-tab',
			'panels container': root + ' .js-previewable-comment-form',
			'panel -> markdown': root + ' .js-previewable-comment-form > file-attachment',
			'panel -> preview':
				root + ' .js-previewable-comment-form > .js-preview-panel, ' +
				root + ' .js-previewable-comment-form > .preview-content',
			'buttons -> submit':
				root + ' input[type=submit].btn-primary,' +
				root + ' button[type=submit].btn-primary',

			// Page
			'page': 'meta[name="selected-link"][value="repo_issues"]'
		} ).forEach( ( [ name, selector ] ) => {
			it( `should have element (${ name })`, async () => {
				expect( await page.hasElement( selector ) ).to.be.true;
			} );
		} );
	} );

	describe( 'Upload info', () => {
		it( 'should have element with url', async () => {
			expect( await page.browserPage.$eval( root + ' textarea',
				el => el
					.closest( '*[data-upload-policy-url]' ) ) ).not.to.be.null;
		} );

		it( 'should have element with csrf', async () => {
			expect( await page.browserPage.$eval( root + ' textarea',
				el => el
					.closest( '*[data-upload-policy-url]' )
					.querySelector( '.js-data-upload-policy-url-csrf[value]' )
			) ).not.to.be.null;
		} );
	} );

	describe( 'Upload', () => {
		it( 'should make the expected posts', () => {
			return new Promise( resolve => {
				( async () => {
					const browserPage = page.browserPage;
					let url = await browserPage.$eval( root + ' textarea', textarea => textarea
						.closest( '*[data-upload-policy-url]' )
						.getAttribute( 'data-upload-policy-url' ) );
					let urlAmazon;

					url = NewIssuePage.getGitHubUrl( url );

					const requests = {};

					page.browserPage.on( 'requestfinished', async request => {
						const requestUrl = NewIssuePage.getGitHubUrl( request.url() );
						switch ( requestUrl ) {
							// GitHub request.
							case url: {
								// await log( request );
								requests.github = request;
								urlAmazon = NewIssuePage.getGitHubUrl( ( await request.response().json() ).upload_url );
								expect( urlAmazon ).to.be.a( 'string' ).not.empty;
								return;
							}

							// Amazon request.
							case urlAmazon: {
								// await log( request );
								requests.amazon = request;
								break;
							}

							default: {
								return;
							}
						}

						// GitHub request/response checks.
						{
							const request = requests.github;

							expect( request.headers() ).to.have.property( 'accept', 'application/json' );
							expect( request.headers() ).to.have.property( 'x-requested-with', 'XMLHttpRequest' );

							const fields = getPostDataFieldNames( requests.github.postData() );

							// We want to be warned by any change on the fields used by GH.
							expect( fields ).to.have.all.members( [
								'name',
								'size',
								'content_type',
								'authenticity_token',
								'repository_id'
							] );

							const response = request.response();

							expect( await response.json() ).to.have.nested.property( 'asset.href' ).to.be.a( 'string' );
						}

						// Amazon request/response checks.
						{
							// We could eventually check postData(), but puppeteer is returning `undefined` for that :/
							// const request = requests.amazon;
							// const fields = getPostDataFieldNames( requests.github.postData() );
							// ...
						}

						resolve();

						// Just for debugging purposes.
						// async function log( request ) {
						// 	const response = request.response();
						//
						// 	console.log( '\n### Request Finished ###' );
						// 	console.log( request.url() );
						// 	console.log( request.method() );
						// 	console.log( request.resourceType() );
						// 	console.log( request.headers() );
						// 	console.log( request.postData() );
						// 	console.log( getPostDataFieldNames( request.postData() ) );
						//
						// 	console.log( '\n### Response ###' );
						// 	console.log( response.ok() );
						// 	console.log( response.status() );
						// 	console.log( response.headers() );
						// 	console.log( await response.text() );
						// }

						function getPostDataFieldNames( postData ) {
							return postData ?
								Array.from( postData
									.matchAll( /name="(.*?)"/g ) )
									.map( match => match[ 1 ] ) :
								[];
						}
					} );

					page.browserPage.on( 'requestfailed', async request => {
						console.log( '\n### Request FAILED ###' );
						console.log( request.url() );
						console.log( request.method() );
						console.log( request.resourceType() );
						console.log( request.headers() );
						console.log( request.postData() );
					} );

					// The following will not work with newer versions of Puppeteer:
					// https://github.com/puppeteer/puppeteer/issues/5537
					let fileChooser = page.browserPage.waitForFileChooser();
					page.browserPage.click( '#fc-issue_body' );
					fileChooser = await fileChooser;
					fileChooser.accept( [ 'tests/_assets/images/ball.png' ] );
				} )();
			} );
		} );
	} );

	describe( 'Mentions info', () => {
		it( 'should have element', async () => {
			expect( await page.browserPage.$eval( root + ' textarea',
				el => el.closest( 'text-expander' ) ), 'element' ).not.to.be.null;
		} );

		it( 'should have issues url', async () => {
			expect( await page.browserPage.$eval( root + ' textarea',
				el => el.closest( 'text-expander[data-issue-url]' ) ) ).not.to.be.null;
		} );

		it( 'should have people url', async () => {
			expect( await page.browserPage.$eval( root + ' textarea',
				el => el.closest( 'text-expander[data-mention-url]' ) ) ).not.to.be.null;
		} );

		it( 'should have emoji url', async () => {
			expect( await page.browserPage.$eval( root + ' textarea',
				el => el.closest( 'text-expander[data-emoji-url]' ) ) ).not.to.be.null;
		} );
	} );

	describe( 'Mentions download', () => {
		it( 'should download issues', async () => {
			const url = await page.browserPage.$eval( root + ' textarea',
				el => el.closest( 'text-expander[data-issue-url]' ).getAttribute( ( 'data-issue-url' ) ) );

			const data = await page.xhrRequest( url, true );

			expect( data ).to.have.property( 'suggestions' );
			expect( data.suggestions ).to.be.an( 'array' );
			data.suggestions.forEach( entry => expect( entry ).to.include.all.keys( [ 'id', 'number', 'title' ] ) );
		} );

		it( 'should download people', async () => {
			const url = await page.browserPage.$eval( root + ' textarea',
				el => el.closest( 'text-expander[data-mention-url]' ).getAttribute( ( 'data-mention-url' ) ) );

			const data = await page.xhrRequest( url, true );

			expect( data ).to.be.an( 'array' );

			data.forEach( entry => {
				expect( entry ).to.include.all.keys( [ 'type', 'id' ] );

				switch ( entry.type ) {
					case 'user':
						expect( entry ).to.include.all.keys( [ 'login', 'name' ] );
						break;
					case 'team':
						expect( entry ).to.include.all.keys( [ 'name', 'description' ] );
						break;
					default:
						expect.fail( `Unknown people mentions type "${ entry.type }".` );
				}
			} );
		} );

		it( 'should download emojis', async () => {
			const url = await page.browserPage.$eval( root + ' textarea',
				el => el.closest( 'text-expander[data-emoji-url]' ).getAttribute( ( 'data-emoji-url' ) ) );

			let data = await page.xhrRequest( url, false );

			expect( data ).to.be.a( 'string' );

			data = await htmlToJson.parse( data, [ 'li', {
				'name': li => li.attr( 'data-emoji-name' ),
				'text': li => li.attr( 'data-text' )
			} ] );

			data.forEach( entry => expect( entry ).to.include.all.keys( [ 'name', 'text' ] ) );
		} );
	} );

	describe( 'Saved Replies', () => {
		it( 'should have url in the toolbar', async () => {
			expect( await page.hasElement( root + ' markdown-toolbar .js-saved-reply-menu[src]' ) ).to.be.true;
		} );
	} );
} );
