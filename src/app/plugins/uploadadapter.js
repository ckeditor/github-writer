/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import FileRepository from '@ckeditor/ckeditor5-upload/src/filerepository';

export default class Uploadadapter extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ FileRepository ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'GitHubUploadAdapter';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		// Define the createUploadAdapter method, which is used to create a new instance of the adapter
		// for every upload that happens in the editor.
		this.editor.plugins.get( FileRepository ).createUploadAdapter = loader => {
			return new Adapter( loader, this.editor );
		};
	}
}

class Adapter {
	constructor( loader, editor ) {
		this.loader = loader;
		this.editor = editor;
	}

	upload() {
		// This variable holds the final result of the whole upload logic: the URL to the uploaded file.
		let returnUrl;

		// This is an async logic, so we return a promise.
		return this.editor.config.get( 'githubRte' ).upload()
			.then( config => {
				return this.loader.file
					// Uploading on GH is made out of two steps. In our logic we're trying to mimic the requests that
					// the original GH pages do, including the exact sets of headers and data.
					.then( file => new Promise( ( resolve, reject ) => {
						// Step 1: a setup request is made to the GH servers, returning the target upload URL
						// and authentication tokens.

						// Setup the form data for the request.
						const data = new FormData();
						{
							// The necessary fields to be posted to GH.
							data.append( 'name', file.name );
							data.append( 'size', file.size );
							data.append( 'content_type', file.type );

							// Append all form entries saved by the GitHubEditor class in the editor configuration.
							Object.entries( config.form )
								.forEach( ( [ key, value ] ) => data.append( key, value ) );
						}

						// The upload url has been also set by the GitHubEditor class.
						this._initRequest( config.url );

						// Configure the request further to match the original GH request.
						this.xhr.responseType = 'json';
						this.xhr.setRequestHeader( 'Accept', 'application/json' );
						this.xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );

						// Run!
						this._initListeners( resolve, reject, file );
						this._sendRequest( data );
					} ) )
					.then( ( { file, response } ) => new Promise( ( resolve, reject ) => {
						// Step 2: the real upload takes place this time to Amazon S3 servers,
						// using information returned from Step 1.

						// The final URL of the file is already known, even before the upload. We save it here.
						returnUrl = response.asset.href;

						// Retrieve the target Amazon S3 upload URL.
						const uploadUrl = response.upload_url;

						// Setup the form data for the request.
						const data = new FormData();
						{
							// Append all form entries received from GH in Step 1.
							Object.entries( response.form )
								.forEach( ( [ key, value ] ) => data.append( key, value ) );

							// Finally, the file to be uploaded. This must be the last entry in the form.
							data.append( 'file', file );
						}

						// Run!
						this._initRequest( uploadUrl );
						this._initListeners( resolve, reject, file );
						this._sendRequest( data );
					} ) )
					.then( ( /* { file, response } */ ) => {
						// Upload concluded! Simply send the file URL back, according to CKEditor specs.
						return {
							default: returnUrl
						};
					} );
			} );
	}

	// Aborts the upload process.
	abort() {
		if ( this.xhr ) {
			this.xhr.abort();
		}
	}

	// Initializes the XMLHttpRequest object using the URL passed to the constructor.
	_initRequest( url ) {
		const xhr = this.xhr = new XMLHttpRequest();
		xhr.open( 'POST', url, true );
	}

	// Initializes XMLHttpRequest listeners.
	_initListeners( resolve, reject, file ) {
		const xhr = this.xhr;
		const loader = this.loader;
		const genericErrorText = `Couldn't upload file: ${ file.name }.`;

		xhr.addEventListener( 'error', () => reject( genericErrorText ) );
		xhr.addEventListener( 'abort', () => reject() );
		xhr.addEventListener( 'load', () => {
			const response = xhr.response;

			// TODO: Implement error handling compatible with GH and Amazon.
			// This example assumes the XHR server's "response" object will come with
			// an "error" which has its own "message" that can be passed to reject()
			// in the upload promise.
			//
			// Your integration may handle upload errors in a different way so make sure
			// it is done properly. The reject() function must be called when the upload fails.
			// if ( !response || response.error ) {
			// 	return reject( response && response.error ? response.error.message : genericErrorText );
			// }

			// Resolve with the final image URL from the GitHub response.
			resolve( { file, response } );
		} );

		// Setup upload progress, if supported.
		if ( xhr.upload ) {
			xhr.upload.addEventListener( 'progress', evt => {
				if ( evt.lengthComputable ) {
					loader.uploadTotal = evt.total;
					loader.uploaded = evt.loaded;
				}
			} );
		}
	}

	// Prepares the data and sends the request.
	_sendRequest( data ) {
		this.xhr.send( data );
	}
}
