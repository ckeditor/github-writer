/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import LiveModelData from '../../../src/app/plugins/livemodeldata';

import HeadingEditing from '@ckeditor/ckeditor5-heading/src/headingediting';
import CodeBlockEditing from '@ckeditor/ckeditor5-code-block/src/codeblockediting';
import BlockQuoteEditing from '@ckeditor/ckeditor5-block-quote/src/blockquoteediting';

import { createTestEditor } from '../../_util/ckeditor';
import { getData, setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';

describe( 'Plugins', () => {
	describe( 'LiveModelData', () => {
		let editor, model, root;

		{
			before( 'create test editor', () => {
				return createTestEditor( '', [ LiveModelData, HeadingEditing, CodeBlockEditing, BlockQuoteEditing ] )
					.then( editorObjects => ( { editor, model, root } = editorObjects ) );
			} );

			after( 'destroy test editor', () => {
				editor.destroy();
			} );
		}

		describe( 'input vs output', () => {
			[
				[
					'<paragraph>Test</paragraph>',
					{ _: [ { e: 'paragraph', _: [ { t: 'Test' } ] } ] }
				],
				[
					'<paragraph>Line 1</paragraph>' +
					'<paragraph>Line 2</paragraph>',

					{
						_: [ { e: 'paragraph', _: [ { t: 'Line 1' } ] },
							{ e: 'paragraph', _: [ { t: 'Line 2' } ] } ]
					}
				],
				[
					'<paragraph>Test <softBreak></softBreak>code</paragraph>',

					{ _: [ { e: 'paragraph', _: [ { t: 'Test ' }, { e: 'softBreak' }, { t: 'code' } ] } ] }
				],
				[
					'<paragraph>Test <$text bold="true">bold</$text> text</paragraph>',

					{
						_: [ {
							e: 'paragraph',
							_: [ { t: 'Test ' }, { t: 'bold', a: { 'bold': true } }, { t: ' text' } ]
						} ]
					}
				],
				[
					'<heading1>Test code</heading1>',
					{ _: [ { e: 'heading1', _: [ { t: 'Test code' } ] } ] }
				],
				[
					'<codeBlock language="javascript">Test</codeBlock>',

					{ _: [ { e: 'codeBlock', a: { 'language': 'javascript' }, _: [ { t: 'Test' } ] } ] }
				],
				[
					'<blockQuote><heading1>Heading</heading1><paragraph>Test</paragraph></blockQuote>',

					{
						_: [
							{
								e: 'blockQuote',
								_: [
									{ e: 'heading1', _: [ { t: 'Heading' } ] },
									{ e: 'paragraph', _: [ { t: 'Test' } ] }
								]
							}
						]
					}
				]
			].forEach( ( [ input, output ], index ) => {
				it( `should output changes (${ index })`, () => {
					setData( model, input );
					expect( model.data ).to.eql( output );
				} );

				it( `should input data (${ index })`, () => {
					model.data = output;
					expect( getData( model, { withoutSelection: true } ) ).to.equals( input );
				} );
			} );
		} );

		describe( 'model changes', () => {
			describe( 'insertText()', () => {
				it( `should reflect text insertion (start)`, () => {
					setData( model, '<paragraph>:test:</paragraph>' );
					model.change( writer => {
						writer.insertText( 'foo', root.getChild( 0 ), 0 );
					} );

					expect( model.data ).to.eql(
						{ _: [ { e: 'paragraph', _: [ { t: 'foo:test:' } ] } ] } );
				} );

				it( `should reflect text insertion (end)`, () => {
					setData( model, '<paragraph>:test:</paragraph>' );
					model.change( writer => {
						writer.insertText( 'foo', root.getChild( 0 ), 'end' );
					} );

					expect( model.data ).to.eql(
						{ _: [ { e: 'paragraph', _: [ { t: ':test:foo' } ] } ] } );
				} );

				it( `should reflect text insertion (middle)`, () => {
					setData( model, '<paragraph>:test:</paragraph>' );
					model.change( writer => {
						writer.insertText( 'foo', root.getChild( 0 ), 3 );
					} );

					expect( model.data ).to.eql(
						{ _: [ { e: 'paragraph', _: [ { t: ':tefoost:' } ] } ] } );
				} );

				it( `should reflect text insertion (when empty)`, () => {
					setData( model, '<paragraph></paragraph>' );

					expect( model.data ).to.eql(
						{ _: [ { e: 'paragraph' } ] } );

					model.change( writer => {
						writer.insertText( 'foo', root.getChild( 0 ), 0 );
					} );

					expect( model.data ).to.eql(
						{ _: [ { e: 'paragraph', _: [ { t: 'foo' } ] } ] } );
				} );
			} );

			describe( 'insertElement()', () => {
				it( `should reflect element insertion (start)`, () => {
					setData( model, '<paragraph>:test:</paragraph>' );
					model.change( writer => {
						writer.insertElement( 'softBreak', root.getChild( 0 ), 0 );
					} );

					expect( model.data ).to.eql(
						{ _: [ { e: 'paragraph', _: [ { e: 'softBreak' }, { t: ':test:' } ] } ] } );
				} );

				it( `should reflect element insertion (end)`, () => {
					setData( model, '<paragraph>:test:</paragraph>' );
					model.change( writer => {
						writer.insertElement( 'softBreak', root.getChild( 0 ), 'end' );
					} );

					expect( model.data ).to.eql(
						{ _: [ { e: 'paragraph', _: [ { t: ':test:' }, { e: 'softBreak' } ] } ] } );
				} );

				it( `should reflect element insertion (middle)`, () => {
					setData( model, '<paragraph>:test:</paragraph>' );
					model.change( writer => {
						writer.insertElement( 'softBreak', root.getChild( 0 ), 3 );
					} );

					expect( model.data ).to.eql(
						{
							_: [ {
								e: 'paragraph',
								_: [ { t: ':te' }, { e: 'softBreak' }, { t: 'st:' } ]
							} ]
						} );
				} );
			} );

			describe( 'remove()', () => {
				// Text
				{
					it( `should reflect text removal (start)`, () => {
						setData( model, '<paragraph>123456</paragraph>' );
						model.change( writer => {
							const range = writer.createRange(
								writer.createPositionAt( root.getChild( 0 ), 0 ),
								writer.createPositionAt( root.getChild( 0 ), 2 )
							);
							writer.remove( range );
						} );

						expect( model.data ).to.eql(
							{ _: [ { e: 'paragraph', _: [ { t: '3456' } ] } ] } );
					} );

					it( `should reflect text removal (end)`, () => {
						setData( model, '<paragraph>123456</paragraph>' );
						model.change( writer => {
							const range = writer.createRange(
								writer.createPositionAt( root.getChild( 0 ), 4 ),
								writer.createPositionAt( root.getChild( 0 ), 'end' )
							);
							writer.remove( range );
						} );

						expect( model.data ).to.eql(
							{ _: [ { e: 'paragraph', _: [ { t: '1234' } ] } ] } );
					} );

					it( `should reflect text removal (middle)`, () => {
						setData( model, '<paragraph>123456</paragraph>' );
						model.change( writer => {
							const range = writer.createRange(
								writer.createPositionAt( root.getChild( 0 ), 2 ),
								writer.createPositionAt( root.getChild( 0 ), 4 )
							);
							writer.remove( range );
						} );

						expect( model.data ).to.eql(
							{ _: [ { e: 'paragraph', _: [ { t: '1256' } ] } ] } );
					} );

					it( `should reflect text removal (all)`, () => {
						setData( model, '<paragraph>123456</paragraph>' );
						model.change( writer => {
							const range = writer.createRange(
								writer.createPositionAt( root.getChild( 0 ), 0 ),
								writer.createPositionAt( root.getChild( 0 ), 'end' )
							);
							writer.remove( range );
						} );

						expect( model.data ).to.eql(
							{ _: [ { e: 'paragraph' } ] } );
					} );
				}

				// Element
				{
					it( `should reflect element removal (start)`, () => {
						setData( model, '<paragraph><softBreak></softBreak>123456</paragraph>' );
						model.change( writer => {
							writer.remove( root.getChild( 0 ).getChild( 0 ) );
						} );

						expect( model.data ).to.eql(
							{ _: [ { e: 'paragraph', _: [ { t: '123456' } ] } ] } );
					} );

					it( `should reflect element removal (end)`, () => {
						setData( model, '<paragraph>123456<softBreak></softBreak></paragraph>' );
						model.change( writer => {
							writer.remove( root.getChild( 0 ).getChild( 1 ) );
						} );

						expect( model.data ).to.eql(
							{ _: [ { e: 'paragraph', _: [ { t: '123456' } ] } ] } );
					} );

					it( `should reflect element removal (middle)`, () => {
						setData( model, '<paragraph>123<softBreak></softBreak>456</paragraph>' );
						model.change( writer => {
							writer.remove( root.getChild( 0 ).getChild( 1 ) );
						} );

						expect( model.data ).to.eql(
							{ _: [ { e: 'paragraph', _: [ { t: '123456' } ] } ] } );
					} );

					it( `should reflect element removal (all)`, () => {
						setData( model, '<paragraph><softBreak></softBreak></paragraph>' );
						model.change( writer => {
							writer.remove( root.getChild( 0 ).getChild( 0 ) );
						} );

						expect( model.data ).to.eql(
							{ _: [ { e: 'paragraph' } ] } );
					} );
				}
			} );

			describe( 'setAttribute()', () => {
				// Text
				{
					it( `should reflect text attribute insertion (start)`, () => {
						setData( model, '<paragraph>some test text</paragraph>' );
						model.change( writer => {
							const range = writer.createRange(
								writer.createPositionAt( root.getChild( 0 ), 0 ),
								writer.createPositionAt( root.getChild( 0 ), 4 )
							);

							writer.setAttribute( 'bold', true, range );
						} );

						expect( model.data ).to.eql(
							{
								_: [ {
									e: 'paragraph',
									_: [ { t: 'some', a: { 'bold': true } }, { t: ' test text' } ]
								} ]
							} );
					} );

					it( `should reflect text attribute insertion (end)`, () => {
						setData( model, '<paragraph>some test text</paragraph>' );
						model.change( writer => {
							const range = writer.createRange(
								writer.createPositionAt( root.getChild( 0 ), 10 ),
								writer.createPositionAt( root.getChild( 0 ), 'end' )
							);

							writer.setAttribute( 'bold', true, range );
						} );

						expect( model.data ).to.eql(
							{
								_: [ {
									e: 'paragraph',
									_: [ { t: 'some test ' }, { t: 'text', a: { 'bold': true } } ]
								} ]
							} );
					} );

					it( `should reflect text attribute insertion (middle)`, () => {
						setData( model, '<paragraph>some test text</paragraph>' );
						model.change( writer => {
							const range = writer.createRange(
								writer.createPositionAt( root.getChild( 0 ), 5 ),
								writer.createPositionAt( root.getChild( 0 ), 9 )
							);

							writer.setAttribute( 'bold', true, range );
						} );

						expect( model.data ).to.eql(
							{
								_: [ {
									e: 'paragraph',
									_: [ { t: 'some ' }, { t: 'test', a: { 'bold': true } }, { t: ' text' } ]
								} ]
							} );
					} );

					it( `should reflect text attribute insertion (mixed siblings)`, () => {
						setData( model, '<paragraph>some <$text italic="true">test</$text><softBreak></softBreak>text</paragraph>' );
						model.change( writer => {
							const range = writer.createRange(
								writer.createPositionAt( root.getChild( 0 ), 2 ),
								writer.createPositionAt( root.getChild( 0 ), 12 )
							);

							writer.setAttribute( 'bold', true, range );
						} );

						expect( model.data ).to.eql(
							{
								_: [ {
									e: 'paragraph',
									_: [
										{ t: 'so' },
										{ t: 'me ', a: { 'bold': true } },
										{ t: 'test', a: { 'bold': true, 'italic': true } },
										{ e: 'softBreak', a: { 'bold': true } },
										{ t: 'te', a: { 'bold': true } },
										{ t: 'xt' } ]
								} ]
							} );
					} );
				}

				// Element
				{
					it( `should reflect element attribute insertion`, () => {
						setData( model, '<paragraph>test</paragraph><codeBlock language="java">code</codeBlock>' );
						model.change( writer => {
							writer.setAttribute( 'language', 'javascript', root.getChild( 1 ) );
						} );

						expect( model.data ).to.eql(
							{
								_: [
									{ e: 'paragraph', _: [ { t: 'test' } ] },
									{ e: 'codeBlock', a: { 'language': 'javascript' }, _: [ { t: 'code' } ] }
								]
							} );
					} );
				}
			} );

			describe( 'merge()', () => {
				it( `should reflect merge`, () => {
					setData( model,
						'<paragraph>test <$text bold="true">123</$text></paragraph>' +
						'<paragraph><$text bold="true">456</$text> text</paragraph>' );
					model.change( writer => {
						writer.merge( writer.createPositionAt( root, 1 ) );
					} );

					expect( model.data ).to.eql(
						{
							_: [ {
								e: 'paragraph',
								_: [ { t: 'test ' }, { t: '123456', a: { 'bold': true } }, { t: ' text' } ]
							} ]
						} );
				} );
			} );

			describe( 'rename()', () => {
				it( `should reflect rename`, () => {
					setData( model,
						'<paragraph>test <$text bold="true">123</$text></paragraph>' +
						'<paragraph><$text bold="true">456</$text> text</paragraph>' );
					model.change( writer => {
						writer.rename( root.getChild( 0 ), 'heading3' );
					} );

					expect( model.data ).to.eql(
						{
							_: [
								{ e: 'heading3', _: [ { t: 'test ' }, { t: '123', a: { 'bold': true } } ] },
								{ e: 'paragraph', _: [ { t: '456', a: { 'bold': true } }, { t: ' text' } ] }
							]
						} );
				} );
			} );

			describe( 'split()', () => {
				it( `should reflect split`, () => {
					setData( model, '<paragraph>123456</paragraph>' );
					model.change( writer => {
						writer.split( writer.createPositionAt( root.getChild( 0 ), 3 ) );
					} );

					expect( model.data ).to.eql(
						{
							_: [
								{ e: 'paragraph', _: [ { t: '123' } ] },
								{ e: 'paragraph', _: [ { t: '456' } ] }
							]
						} );
				} );
			} );
		} );
	} );
} );
