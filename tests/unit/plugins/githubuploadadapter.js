/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import GitHubUploadAdapter, { Adapter } from '../../../src/app/plugins/githubuploadadapter';
import FileRepository from '@ckeditor/ckeditor5-upload/src/filerepository';

import { createTestEditor } from '../../_util/ckeditor';

describe( 'Plugins', () => {
	describe( 'GitHubUploadAdapter', () => {
		let editor;

		{
			beforeEach( 'create test editor', () => {
				return createTestEditor( '', [ GitHubUploadAdapter ] )
					.then( editorObjects => {
						editor = editorObjects.editor;

						editor.config.set( 'githubWriter.upload', () =>
							Promise.resolve( {
								url: 'upload-url',
								form: {
									authenticity_token: 'token',
									repository_id: 'repo-id'
								}
							} ) );
					} );
			} );

			afterEach( 'cleanup test editor', () => {
				editor.destroy();
			} );
		}

		it( 'should require plugins', () => {
			expect( GitHubUploadAdapter.requires ).to.include( FileRepository );
		} );

		it( 'should initialize the createUploadAdapter method', () => {
			const createUploadAdapter = editor.plugins.get( FileRepository ).createUploadAdapter;
			expect( createUploadAdapter ).to.be.a( 'function' );
			expect( createUploadAdapter( null, editor ) ).to.be.an.instanceOf( Adapter );
		} );

		describe( 'Adapter', () => {
			let adapter;
			let xhr;

			{
				beforeEach( () => {
					const loader = editor.plugins.get( FileRepository ).createLoader( {
						name: 'image.jpeg',
						type: 'image/jpeg',
						size: 1024
					} );

					adapter = new Adapter( loader, editor );
				} );

				beforeEach( () => {
					xhr = null;
					const sinonXhr = sinon.useFakeXMLHttpRequest();
					sinonXhr.onCreate = createdXhr => ( xhr = createdXhr );
				} );
			}

			it( 'should implement the UploadAdapter interface', () => {
				expect( adapter.abort ).to.be.a( 'function' );
				expect( adapter.upload ).to.be.a( 'function' );
			} );

			describe( 'upload()', () => {
				it( 'should send proper requests to GitHub and Amazon', done => {
					const promise = adapter.upload();

					setTimeout( () => {
						expect( xhr.url ).to.equals( 'upload-url' );
						expect( xhr.method ).to.equals( 'POST' );
						expect( xhr.responseType ).to.equals( 'json' );
						expect( xhr.async ).to.be.true;
						expect( xhr.requestHeaders ).to.have.property( 'Accept', 'application/json' );
						expect( xhr.requestHeaders ).to.not.have.property( 'X-Requested-With', 'XMLHttpRequest' );

						expect( xhr.requestBody ).to.be.an.instanceOf( FormData );
						expect( xhr.requestBody.get( 'name' ) ).to.equals( 'image.jpeg' );
						expect( xhr.requestBody.get( 'content_type' ) ).to.equals( 'image/jpeg' );
						expect( xhr.requestBody.get( 'size' ) ).to.equals( '1024' );
						expect( xhr.requestBody.get( 'authenticity_token' ) ).to.equals( 'token' );
						expect( xhr.requestBody.get( 'repository_id' ) ).to.equals( 'repo-id' );

						xhr.respond( 200, { 'Content-Type': 'application/json' }, JSON.stringify( {
							upload_url: 'amazon-upload-url',
							asset: {
								href: 'final-image-url'
							},
							form: {
								field1: 'test-1',
								field2: 'test-2'
							}
						} ) );

						xhr = null;

						setTimeout( () => {
							expect( xhr.url ).to.equals( 'amazon-upload-url' );
							expect( xhr.method ).to.equals( 'POST' );

							expect( xhr.requestBody ).to.be.an.instanceOf( FormData );
							expect( xhr.requestBody.get( 'field1' ) ).to.equals( 'test-1' );
							expect( xhr.requestBody.get( 'field2' ) ).to.equals( 'test-2' );
							expect( xhr.requestBody.get( 'file' ) ).to.exist;

							xhr.respond( 204 );

							xhr = null;

							setTimeout( () => {
								promise.then( result => {
									expect( result ).to.eql( {
										default: 'final-image-url'
									} );
									done();
								} );
							}, 0 );
						}, 0 );
					}, 0 );
				} );

				it( 'should reject on abort (GitHub)', done => {
					const promise = adapter.upload();

					setTimeout( () => {
						xhr.abort();

						promise.catch( err => {
							expect( err ).to.be.undefined;
							done();
						} );
					}, 0 );
				} );

				it( 'should reject on abort (Amazon)', done => {
					const promise = adapter.upload();

					setTimeout( () => {
						xhr.respond( 200, { 'Content-Type': 'application/json' }, JSON.stringify( {
							upload_url: 'amazon-upload-url',
							asset: {
								href: 'final-image-url'
							},
							form: {
								field1: 'test-1',
								field2: 'test-2'
							}
						} ) );

						xhr = null;

						setTimeout( () => {
							xhr.abort();

							promise.catch( err => {
								expect( err ).to.be.undefined;
								done();
							} );
						}, 0 );
					}, 0 );
				} );

				it( 'should reject on error (GitHub)', done => {
					const promise = adapter.upload();

					setTimeout( () => {
						xhr.error();

						promise.catch( err => {
							expect( err ).to.be.a( 'string' );
							done();
						} );
					}, 0 );
				} );

				it( 'should reject on error (Amazon)', done => {
					const promise = adapter.upload();

					setTimeout( () => {
						xhr.respond( 200, { 'Content-Type': 'application/json' }, JSON.stringify( {
							upload_url: 'amazon-upload-url',
							asset: {
								href: 'final-image-url'
							},
							form: {
								field1: 'test-1',
								field2: 'test-2'
							}
						} ) );

						xhr = null;

						setTimeout( () => {
							xhr.error();

							promise.catch( err => {
								expect( err ).to.be.a( 'string' );
								done();
							} );
						}, 0 );
					}, 0 );
				} );
			} );

			describe( 'abort()', () => {
				it( 'should call xhr.abort', done => {
					adapter.upload();

					setTimeout( () => {
						sinon.spy( xhr, 'abort' );
						adapter.abort();
						expect( xhr.abort.callCount ).to.equals( 1 );
						done();
					}, 0 );
				} );

				it( 'should do nothing if no upload running', () => {
					expect( adapter.xhr ).to.be.undefined;
					expect( () => adapter.abort() ).to.not.throw();
				} );
			} );
		} );
	} );
} );
