/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import PasteFixer from '../../../src/app/plugins/pastefixer';
import Clipboard from '@ckeditor/ckeditor5-clipboard/src/clipboard';
import LinkEditing from '@ckeditor/ckeditor5-link/src/linkediting';

import { createTestEditor } from '../../_util/ckeditor';
import { stringify as stringifyModel } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';

describe( 'Plugins', () => {
	describe( 'PasteFixer', () => {
		let editor;

		{
			beforeEach( 'create test editor', () => {
				return createTestEditor( '', [ PasteFixer, LinkEditing ] )
					.then( editorObjects => {
						editor = editorObjects.editor;

						// VirtualTestEditor has no DOM, so this method must be stubbed for all tests.
						// Otherwise it will throw as it accesses the DOM to do its job.
						sinon.stub( editor.editing.view, 'scrollToTheSelection' );
					} );
			} );

			afterEach( 'cleanup test editor', () => {
				editor.destroy();
			} );
		}

		function createDataTransfer( data ) {
			return {
				getData( type ) {
					return data[ type ];
				},

				setData( type, newData ) {
					data[ type ] = newData;
				}
			};
		}

		it( 'should require the Clipboard plugin', () => {
			expect( PasteFixer.requires ).to.include( Clipboard );
		} );

		{
			[ 'https', 'http' ].forEach( protocol => {
				it( `should fix url links that point to the href (${ protocol })`, () => {
					const dataTransferMock = createDataTransfer( {
						// The following is the HTML added by Chrome to the clipboard.
						'text/html': `<meta charset='utf-8'><a href="${ protocol }://ckeditor.com/">${ protocol }://ckeditor.com/</a>`,
						'text/plain': 'Should fix text/html'
					} );

					const spy = sinon.stub( editor.model, 'insertContent' );

					editor.editing.view.document.fire( 'paste', {
						dataTransfer: dataTransferMock,
						preventDefault() {
						},
						stopPropagation() {
						}
					} );

					expect( spy.calledOnce ).to.be.true;
					expect( stringifyModel( spy.args[ 0 ][ 0 ] ) ).to.equal( `${ protocol }://ckeditor.com/` );
				} );
			} );
		}

		it( 'should not touch url links that point to the different href', () => {
			const dataTransferMock = createDataTransfer( {
				'text/html': '<meta charset=\'utf-8\'><a href="https://ckeditor.com/">https://test.com/</a>',
				'text/plain': 'Should fix text/html'
			} );

			const spy = sinon.stub( editor.model, 'insertContent' );

			editor.editing.view.document.fire( 'paste', {
				dataTransfer: dataTransferMock,
				preventDefault() {
				},
				stopPropagation() {
				}
			} );

			expect( spy.calledOnce ).to.be.true;
			expect( stringifyModel( spy.args[ 0 ][ 0 ] ) ).to.equal( '<$text linkHref="https://ckeditor.com/">https://test.com/</$text>' );
		} );

		it( 'should do nothing if no text/html available', () => {
			const dataTransferMock = createDataTransfer( {
				'text/plain': 'https://test.com/'
			} );

			const spy = sinon.stub( editor.model, 'insertContent' );

			editor.editing.view.document.fire( 'paste', {
				dataTransfer: dataTransferMock,
				preventDefault() {
				},
				stopPropagation() {
				}
			} );

			expect( spy.calledOnce ).to.be.true;
			expect( stringifyModel( spy.args[ 0 ][ 0 ] ) ).to.equal( 'https://test.com/' );
		} );
	} );
} );
