/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Messenger from '../../../src/app/plugins/messenger';
import LiveModelData from '../../../src/app/plugins/livemodeldata';

import { createTestEditor } from '../../_util/ckeditor';

describe( 'Plugins', () => {
	describe( 'Messenger', () => {
		let editor;

		{
			before( 'create test editor', () => {
				return createTestEditor( 'Test **editor**', [ Messenger, LiveModelData ] )
					.then( editorObjects => ( { editor } = editorObjects ) );
			} );

			after( 'destroy test editor', () => {
				editor.destroy();
			} );
		}

		let messageCount = 0;

		function sendMessage( command, ...args ) {
			const thisRequestId = 'gw-tests-' + ( ++messageCount );

			const promise = new Promise( resolve => {
				window.addEventListener( 'message', messageListener, { passive: true } );

				function messageListener( event ) {
					const { type, requestId } = event.data;

					if ( type === 'CKEditor-Messenger-Response' && requestId === thisRequestId ) {
						window.removeEventListener( 'message', messageListener );

						resolve( event.data );
					}
				}
			} );

			window.postMessage( {
				type: 'CKEditor-Messenger-Request',
				requestId: thisRequestId,
				editorId: editor.id,
				command,
				args
			}, '*' );

			return promise;
		}

		it( 'should execute getData', () => {
			return sendMessage( 'getData' ).then( data => {
				expect( data ).to.eql( {
					requestId: 'gw-tests-' + messageCount,
					returnValue: 'Test **editor**',
					status: 'ok',
					type: 'CKEditor-Messenger-Response'
				} );
			} );
		} );

		it( 'should execute getModelData', () => {
			return sendMessage( 'getModelData' ).then( data => {
				data.returnValue = JSON.parse( data.returnValue );

				expect( data ).to.eql( {
					requestId: 'gw-tests-' + messageCount,
					returnValue: {
						_: [ {
							e: 'paragraph',
							_: [ { t: 'Test ' }, { t: 'editor', a: { 'bold': true } } ]
						} ]
					},
					status: 'ok',
					type: 'CKEditor-Messenger-Response'
				} );
			} );
		} );

		it( 'should return unknown command', () => {
			return sendMessage( 'testUnknownCmd' ).then( data => {
				expect( data ).to.eql( {
					requestId: 'gw-tests-' + messageCount,
					returnValue: undefined,
					status: 'command-unknown',
					type: 'CKEditor-Messenger-Response'
				} );
			} );
		} );
	} );
} );
