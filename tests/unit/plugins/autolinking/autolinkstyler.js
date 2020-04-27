/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { AutoLinkStyler } from '../../../../src/app/plugins/autolinking';
import CodeBlockEditing from '@ckeditor/ckeditor5-code-block/src/codeblockediting';

import { getData as getViewData } from '@ckeditor/ckeditor5-engine/src/dev-utils/view';
import { createTestEditor } from '../../../_util/ckeditor';

describe( 'Plugins', () => {
	describe( 'AutoLinking', () => {
		describe( 'AutoLinkStyler', () => {
			let editor, model, root;

			beforeEach( 'create test editor', () => {
				return createTestEditor( '', [ CodeBlockEditing ] )
					.then( ret => ( { editor, model, root } = ret ) );
			} );

			afterEach( () => {
				return editor.destroy();
			} );

			describe( 'constructor()', () => {
				it( `should extend the editor schema`, () => {
					// eslint-disable-next-line no-new
					new AutoLinkStyler( editor );

					expect( model.schema.checkAttribute( [ '$root', '$text' ], 'autolink' ) ).to.be.true;
					expect( model.schema.checkAttribute( [ '$block', '$text' ], 'autolink' ) ).to.be.true;
					expect( model.schema.checkAttribute( [ '$clipboardHolder', '$text' ], 'autolink' ) ).to.be.true;

					expect( model.schema.checkAttribute( [ '$block' ], 'autolink' ) ).to.be.false;
				} );

				it( `should set the attribute properties in the editor schema`, () => {
					// eslint-disable-next-line no-new
					new AutoLinkStyler( editor );

					expect( model.schema.getAttributeProperties( 'autolink' ) ).to.deep.equal( {
						isFormatting: false,
						copyOnEnter: false
					} );
				} );
			} );

			describe( 'conversion', () => {
				it( `should convert to editing view`, () => {
					// eslint-disable-next-line no-new
					new AutoLinkStyler( editor );

					editor.setData( 'AB CD EF' );

					model.change( writer => {
						writer.setAttribute( 'autolink', { enabled: true }, writer.createRange(
							writer.createPositionFromPath( root, [ 0, 3 ] ),
							writer.createPositionFromPath( root, [ 0, 5 ] ) ) );
					} );

					expect( getViewData( editor.editing.view, { withoutSelection: true } ) ).to.equal(
						'<p>AB <autolink data-enabled="true" spellcheck="false">CD</autolink> EF</p>' );
				} );

				it( `should not convert to data`, () => {
					// eslint-disable-next-line no-new
					new AutoLinkStyler( editor );

					editor.setData( 'AB CD EF' );

					model.change( writer => {
						writer.setAttribute( 'autolink', { enabled: true }, writer.createRange(
							writer.createPositionFromPath( root, [ 0, 3 ] ),
							writer.createPositionFromPath( root, [ 0, 5 ] ) ) );
					} );

					expect( editor.getData() ).to.equal( 'AB CD EF' );
				} );

				it( `should not convert to model`, () => {
					// eslint-disable-next-line no-new
					new AutoLinkStyler( editor );

					editor.setData( 'AB <autolink>CD</autolink> EF' );

					expect( root.getChild( 0 ).getChild( 0 ).data ).to.equals( 'AB CD EF' );
				} );
			} );

			it( 'should style a matched pattern', () => {
				const styler = new AutoLinkStyler( editor );
				styler.addPattern( /\w{3}/, 'type-3' );

				editor.setData( 'AB CDE FG' );

				expect( getViewData( editor.editing.view, { withoutSelection: true } ) ).to.equal(
					'<p>AB <autolink data-enabled="true" data-text="CDE" data-type="type-3" spellcheck="false">CDE</autolink> FG</p>' );
			} );

			it( 'should style several matched pattern', () => {
				const styler = new AutoLinkStyler( editor );
				styler.addPattern( /\w{3}/, 'type-3' );
				styler.addPattern( /\w{2}/, 'type-2' );

				editor.setData( 'AB CDE FG' );

				expect( getViewData( editor.editing.view, { withoutSelection: true } ) ).to.equal(
					'<p>' +
					'<autolink data-enabled="true" data-text="AB" data-type="type-2" spellcheck="false">AB</autolink> ' +
					'<autolink data-enabled="true" data-text="CDE" data-type="type-3" spellcheck="false">CDE</autolink> ' +
					'<autolink data-enabled="true" data-text="FG" data-type="type-2" spellcheck="false">FG</autolink>' +
					'</p>' );
			} );

			it( 'should not style inside code block', () => {
				const styler = new AutoLinkStyler( editor );
				styler.addPattern( /\w{3}/, 'type-3' );

				editor.setData(
					'AB CDE FG\n' +
					'\n' +
					'```\n' +
					`AB CDE FG\n` +
					'```\n'
				);

				expect( getViewData( editor.editing.view, { withoutSelection: true } ) ).to.equal(
					'<p>AB <autolink data-enabled="true" data-text="CDE" data-type="type-3" spellcheck="false">CDE</autolink> FG</p>' +
					'<pre data-language="Plain text" spellcheck="false"><code class="language-plaintext">AB CDE FG</code></pre>' );
			} );

			it( 'should call the callback', () => {
				const styler = new AutoLinkStyler( editor );
				styler.addPattern( /\w{3}/, 'type-3', attribs => ( attribs.test = 'true' ) );

				editor.setData( 'AB CDE FG' );

				expect( getViewData( editor.editing.view, { withoutSelection: true } ) ).to.equal(
					'<p>' +
					'AB ' +
					'<autolink data-enabled="true" data-test="true" data-text="CDE" data-type="type-3" spellcheck="false">CDE</autolink> ' +
					'FG' +
					'</p>' );
			} );

			it( 'should be disabled by callback', () => {
				const styler = new AutoLinkStyler( editor );
				styler.addPattern( /\w{3}/, 'type-3', () => false );

				editor.setData( 'AB CDE FG' );

				expect( getViewData( editor.editing.view, { withoutSelection: true } ) ).to.equal(
					'<p>' +
					'AB ' +
					'<autolink data-enabled="false" data-text="CDE" data-type="type-3">CDE</autolink> ' +
					'FG' +
					'</p>' );
			} );

			it( 'should allow callback to return a promise', done => {
				const styler = new AutoLinkStyler( editor );
				let promiseCalled = false;

				styler.addPattern( /\w{3}/, 'type-3', attribs => {
					if ( promiseCalled ) {
						attribs.test = 'true';

						setTimeout( () => {
							expect( getViewData( editor.editing.view, { withoutSelection: true } ) ).to.equal(
								'<p>' +
								'AB ' +
								'<autolink data-enabled="true" data-test="true" data-text="CDE" data-type="type-3" spellcheck="false">' +
								'CDE' +
								'</autolink> ' +
								'FG' +
								'</p>' );

							done();
						} );
					} else {
						return new Promise( resolve => {
							promiseCalled = true;
							resolve();
						} );
					}
				} );

				editor.setData( 'AB CDE FG' );

				expect( getViewData( editor.editing.view, { withoutSelection: true } ) ).to.equal(
					'<p>' +
					'AB ' +
					'<autolink data-enabled="true" data-text="CDE" data-type="type-3" spellcheck="false">CDE</autolink> ' +
					'FG' +
					'</p>' );
			} );
		} );
	} );
} );
