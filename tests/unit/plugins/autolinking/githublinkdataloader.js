/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { GitHubLinkDataLoader } from '../../../../src/app/plugins/autolinking';
import { GitHubPage } from '../../../_util/githubpage';

describe( 'Plugins', () => {
	describe( 'AutoLinking', () => {
		describe( 'GitHubLinkDataLoader', () => {
			const previewUrl = 'https://preview/test';
			const previewToken = 'the-token';
			let sinonXhr;
			let element;

			{
				beforeEach( 'stub XMLHttpRequest', () => {
					sinonXhr = sinon.useFakeXMLHttpRequest();
				} );
			}

			{
				beforeEach( 'create the necessary dom elements', () => {
					if ( !element ) {
						element = GitHubPage.appendElementHtml( `
				<form data-preview-url="${ previewUrl }">
					<input class="js-data-preview-url-csrf" value="${ previewToken }">
				</form>
			` );
					}
				} );

				afterEach( 'cleanup', () => {
					element = null;
				} );
			}

			describe( 'getPreviewUrlInfo()', () => {
				it( 'should get the url information', () => {
					const loader = new GitHubLinkDataLoader();

					expect( loader.getPreviewUrlInfo() ).to.deep.equals( {
						url: previewUrl,
						token: previewToken
					} );
				} );

				it( 'should cache the url information', () => {
					const loader = new GitHubLinkDataLoader();
					const info = loader.getPreviewUrlInfo();

					// Return the same object.
					expect( loader.getPreviewUrlInfo() ).to.equals( info );
				} );

				it( 'should console.error on failure', () => {
					// Remove the elements from the dom, to cause failure.
					element.remove();
					element = null;

					const loader = new GitHubLinkDataLoader();

					const stub = sinon.stub( console, 'error' );

					expect( loader.getPreviewUrlInfo() ).to.be.undefined;

					console.error.restore();

					expect( stub.calledOnce ).to.be.true;
					expect( stub.args[ 0 ][ 0 ] ).to.equals( 'GitHub RTE error: could not retrieve the preview url.' );
				} );
			} );

			describe( 'load()', () => {
				function checkXhr( xhr ) {
					expect( xhr.url ).to.equals( previewUrl );
					expect( xhr.method ).to.equals( 'POST' );
					expect( xhr.async ).to.be.true;
					expect( xhr.requestHeaders ).to.have.property( 'X-Requested-With', 'XMLHttpRequest' );

					expect( xhr.requestBody ).to.be.an.instanceOf( FormData );
					expect( xhr.requestBody.get( 'text' ) ).to.equals( 'test' );
					expect( xhr.requestBody.get( 'authenticity_token' ) ).to.equals( previewToken );
				}

				it( 'should resolve with `false` if no link', () => {
					const loader = new GitHubLinkDataLoader();

					let xhr;

					sinonXhr.onCreate = createdXhr => ( xhr = createdXhr );

					const promise = loader.load( 'test' )
						.then( urlInfo => {
							expect( urlInfo ).to.be.false;
						} );

					checkXhr( xhr );

					xhr.respond( 200, { 'Content-Type': 'text/html' }, '<p>test</p>' );

					expect( promise ).to.be.an.instanceOf( Promise );
					return promise;
				} );

				it( 'should resolve with link data', () => {
					const loader = new GitHubLinkDataLoader();

					let xhr;

					sinonXhr.onCreate = createdXhr => ( xhr = createdXhr );

					const promise = loader.load( 'test' )
						.then( urlInfo => {
							expect( urlInfo ).to.deep.equals( {
								url: 'https://test.com/test',
								text: 'response-text',
								'hovercard-type': 'test-type',
								'hovercard-url': '/test/hovercard'
							} );
						} );

					expect( promise ).to.be.an.instanceOf( Promise );

					checkXhr( xhr );

					xhr.respond( 200, { 'Content-Type': 'text/html' },
						'<p><a ' +
						'data-hovercard-type="test-type" ' +
						'data-hovercard-url="/test/hovercard" ' +
						'href="https://test.com/test">' +
						'response-text' +
						'</a></p>' );

					return promise;
				} );

				it( 'should resolve not return text with space', () => {
					const loader = new GitHubLinkDataLoader();

					let xhr;

					sinonXhr.onCreate = createdXhr => ( xhr = createdXhr );

					const promise = loader.load( 'test' )
						.then( urlInfo => {
							expect( urlInfo ).to.deep.equals( {
								url: 'https://test.com/test',
								text: 'test',
								'hovercard-type': 'test-type',
								'hovercard-url': '/test/hovercard'
							} );
						} );

					expect( promise ).to.be.an.instanceOf( Promise );

					checkXhr( xhr );

					xhr.respond( 200, { 'Content-Type': 'text/html' },
						'<p><a ' +
						'data-hovercard-type="test-type" ' +
						'data-hovercard-url="/test/hovercard" ' +
						'href="https://test.com/test">' +
						'response with space' +
						'</a></p>' );

					return promise;
				} );

				it( 'should take from cache on second call', () => {
					const loader = new GitHubLinkDataLoader();

					let xhr;

					sinonXhr.onCreate = createdXhr => ( xhr = createdXhr );

					const promise = loader.load( 'test' )
						.then( urlInfo => {
							expect( loader.load( 'test' ) ).to.equals( urlInfo );
						} );

					xhr.respond( 200, { 'Content-Type': 'text/html' },
						'<p><a ' +
						'data-hovercard-type="test-type" ' +
						'data-hovercard-url="/test/hovercard" ' +
						'href="https://test.com/test">' +
						'test' +
						'</a></p>' );

					expect( promise ).to.be.an.instanceOf( Promise );
					return promise;
				} );

				it( 'should take cache changed text', () => {
					const loader = new GitHubLinkDataLoader();

					let xhr;

					sinonXhr.onCreate = createdXhr => ( xhr = createdXhr );

					const promise = loader.load( 'test' )
						.then( urlInfo => {
							expect( loader.load( 'test' ) ).to.equals( urlInfo );
							expect( loader.load( 'change-test' ) ).to.equals( urlInfo );
						} );

					xhr.respond( 200, { 'Content-Type': 'text/html' },
						'<p><a ' +
						'data-hovercard-type="test-type" ' +
						'data-hovercard-url="/test/hovercard" ' +
						'href="https://test.com/test">' +
						'change-test' +
						'</a></p>' );

					expect( promise ).to.be.an.instanceOf( Promise );
					return promise;
				} );

				it( 'should reject on abort', () => {
					const loader = new GitHubLinkDataLoader();

					let xhr;

					sinonXhr.onCreate = createdXhr => ( xhr = createdXhr );

					const stub = sinon.stub( console, 'error' );

					const promise = loader.load( 'test' )
						.then( urlInfo => {
							console.error.restore();

							expect( urlInfo ).to.be.false;

							expect( stub.called ).to.be.false;
						} )
						.catch( () => expect.fail( 'should not reject' ) );

					xhr.abort();

					expect( promise ).to.be.an.instanceOf( Promise );
					return promise;
				} );

				it( 'should reject on error', () => {
					const loader = new GitHubLinkDataLoader();

					let xhr;

					sinonXhr.onCreate = createdXhr => ( xhr = createdXhr );

					const stub = sinon.stub( console, 'error' );

					const promise = loader.load( 'test' )
						.catch( () => expect.fail( 'should not reject' ) )
						.then( urlInfo => {
							console.error.restore();

							expect( urlInfo ).to.be.false;

							expect( stub.calledOnce ).to.be.true;
							expect( stub.args[ 0 ][ 0 ] ).to.be.an.instanceOf( Error );
						} );

					xhr.error();

					expect( promise ).to.be.an.instanceOf( Promise );
					return promise;
				} );
			} );
		} );
	} );
} );
