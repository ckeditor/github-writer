/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import FileRepository from '@ckeditor/ckeditor5-upload/src/filerepository';

/**
 * The upload adapter that integrates the GitHub file upload infrastructure with CKEditor.
 */
export default class GitHubUploadAdapter extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ FileRepository ];
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

/**
 * The adapter created on demand for each file upload request.
 *
 * @implements {UploadAdapter}
 */
class Adapter {
	/**
	 * Create an upload adapter
	 * @param {FileLoader} loader The file loader instane active for this upload.
	 * @param {Editor} editor The CKEditor instance of this adapter.
	 */
	constructor( loader, editor ) {
		this.loader = loader;
		this.editor = editor;
	}

	/**
	 * Executes the upload process.
	 *
	 * @returns {Promise<{default: *}>} A promise that resolves to an object containing the url to reach the uploaded file.
	 */
	upload() {
		// This variable holds the final result of the whole upload logic: the URL to the uploaded file.
		let returnUrl;

		// This is an async operation that involves 2 or 3 xhr requests.
		//
		// Start by taking the upload configuration, extracting it from the page.
		//
		// If the page will not have this information (wiki), a fallback solution is in place, making
		// a xhr to issues/new and retrieving the configuration from there. All inside upload().
		return this.editor.config.get( 'githubRte' ).upload()
			// The upload configuration is passed along.
			.then( config => {
				// Now we wait for the file to get loaded in the CKEditor API.
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

							// Append all form entries available in the editor configuration (taken from the page).
							Object.entries( config.form )
								.forEach( ( [ key, value ] ) => data.append( key, value ) );
						}

						// The upload url is also retrieved from configuration.
						this._initRequest( config.url );

						// Setup the request further to match the original GH request.
						this.xhr.responseType = 'json';
						this.xhr.setRequestHeader( 'Accept', 'application/json' );
						this.xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );

						// _initListeners is the one responsible to resolve this promise.
						this._initListeners( resolve, reject, file );

						// Run!
						this._sendRequest( data );
					} ) )
					// The file and the response from the above request are passed along.
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

						this._initRequest( uploadUrl );

						// _initListeners is the one responsible to resolve this promise.
						this._initListeners( resolve, reject, file );

						// Run!
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

	/**
	 * Aborts the upload process.
	 */
	abort() {
		if ( this.xhr ) {
			this.xhr.abort();
		}
	}

	/**
	 * Initializes the xhr object.
	 *
	 * @param {String} url The endpoint of the request to be made.
	 * @private
	 */
	_initRequest( url ) {
		const xhr = this.xhr = new XMLHttpRequest();
		xhr.open( 'POST', url, true );
	}

	/**
	 * Setup event listeners (load/abort/error) of the xhr to be sent. These events are responsible for resolving or
	 * rejecting the pending state of the promise returned by upload().
	 *
	 * @param {Function} resolve The function to be called once the xhr request is complete and successful.
	 *   An object { file, response } is passed to this function.
	 * @param {Function} reject The function to be called once the xhr aborts or returns an error.
	 * @param {File} file The file being uploaded.
	 * @private
	 */
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

	/**
	 * Sends the xhr request.
	 *
	 * @param {FormData} data The data being sent in this request.
	 * @private
	 */
	_sendRequest( data ) {
		this.xhr.send( data );
	}
}
