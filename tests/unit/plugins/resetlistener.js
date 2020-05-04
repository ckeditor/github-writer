/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ResetListener from '../../../src/app/plugins/resetlistener';

import { createTestEditor } from '../../_util/ckeditor';

describe( 'Plugins', () => {
	describe( 'ResetListener', () => {
		let editor;

		{
			beforeEach( 'create test editor', () => {
				return createTestEditor( 'Test', [ ResetListener ] )
					.then( editorObjects => ( { editor } = editorObjects ) );
			} );

			afterEach( 'cleanup test editor', () => {
				editor.destroy();
			} );
		}

		it( 'should set the editor empty', done => {
			expect( editor.getData() ).to.equals( 'Test' );
			window.postMessage( { type: 'GitHub-Writer-Reset-Editor' } );

			setTimeout( () => {
				expect( editor.getData() ).to.equals( '' );
				done();
			}, 0 );
		} );

		it( 'should do nothing on other messages', done => {
			expect( editor.getData() ).to.equals( 'Test' );
			window.postMessage( { type: 'GitHub-Writer-Test' } );

			setTimeout( () => {
				expect( editor.getData() ).to.equals( 'Test' );
				done();
			}, 0 );
		} );
	} );
} );
