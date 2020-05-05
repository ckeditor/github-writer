/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
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

		it( `should take from cache on second call`, () => {
			// The only way to confirm the validity of this test is doing it.only() and check code coverage reports.

			// This should enter on both branches of the `if` block inside get().
			expect( model.data ).to.equals( model.data );

			editor.setData( 'test' );

			// This should not enter into the cache branch.
			expect( model.data ).to.be.a( 'string' );
		} );

		it( `should escape characters`, () => {
			setData( model, '<codeBlock language="test">code</codeBlock>' );

			model.change( writer => {
				writer.setAttribute( 'language', 'test-&-and-"quote"-and-<tag>', root.getChild( 0 ) );
				writer.appendText( ' & and <test>', root.getChild( 0 ) );
			} );

			model.data = String( model.data );

			expect( root.getChild( 0 ).getAttribute( 'language' ) ).to.equals( 'test-&-and-"quote"-and-<tag>' );
			expect( root.getChild( 0 ).getChild( 0 ).data ).to.equals( 'code & and <test>' );
		} );

		describe( 'input vs output', () => {
			[
				[
					'<paragraph>Test</paragraph>',
					'<root><element name="paragraph"><text>Test</text></element></root>'
				],
				[
					'<paragraph>Line 1</paragraph>' +
					'<paragraph>Line 2</paragraph>',

					'<root>' +
					'<element name="paragraph"><text>Line 1</text></element>' +
					'<element name="paragraph"><text>Line 2</text></element>' +
					'</root>'
				],
				[
					'<paragraph>Test <softBreak></softBreak>code</paragraph>',

					'<root><element name="paragraph">' +
					'<text>Test </text>' +
					'<element name="softBreak"></element>' +
					'<text>code</text>' +
					'</element></root>'
				],
				[
					'<paragraph>Test <$text bold="true">bold</$text> text</paragraph>',

					'<root><element name="paragraph">' +
					'<text>Test </text>' +
					'<text attribs="{&quot;bold&quot;:true}">bold</text>' +
					'<text> text</text>' +
					'</element></root>'
				],
				[
					'<heading1>Test code</heading1>',
					'<root><element name="heading1"><text>Test code</text></element></root>'
				],
				[
					'<codeBlock language="javascript">Test</codeBlock>',

					'<root>' +
					'<element name="codeBlock" attribs="{&quot;language&quot;:&quot;javascript&quot;}">' +
					'<text>Test</text>' +
					'</element>' +
					'</root>'
				],
				[
					'<blockQuote><heading1>Heading</heading1><paragraph>Test</paragraph></blockQuote>',

					'<root><element name="blockQuote">' +
					'<element name="heading1"><text>Heading</text></element>' +
					'<element name="paragraph"><text>Test</text></element>' +
					'</element></root>'
				]
			].forEach( ( [ input, output ], index ) => {
				it( `should output changes (${ index })`, () => {
					setData( model, input );
					expect( model.data ).to.equal( output );
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

					expect( model.data ).to.equal( '<root><element name="paragraph"><text>foo:test:</text></element></root>' );
				} );

				it( `should reflect text insertion (end)`, () => {
					setData( model, '<paragraph>:test:</paragraph>' );
					model.change( writer => {
						writer.insertText( 'foo', root.getChild( 0 ), 'end' );
					} );

					expect( model.data ).to.equal( '<root><element name="paragraph"><text>:test:foo</text></element></root>' );
				} );

				it( `should reflect text insertion (middle)`, () => {
					setData( model, '<paragraph>:test:</paragraph>' );
					model.change( writer => {
						writer.insertText( 'foo', root.getChild( 0 ), 3 );
					} );

					expect( model.data ).to.equal( '<root><element name="paragraph"><text>:tefoost:</text></element></root>' );
				} );
			} );

			describe( 'insertElement()', () => {
				it( `should reflect element insertion (start)`, () => {
					setData( model, '<paragraph>:test:</paragraph>' );
					model.change( writer => {
						writer.insertElement( 'softBreak', root.getChild( 0 ), 0 );
					} );

					expect( model.data ).to.equal(
						'<root><element name="paragraph"><element name="softBreak"></element><text>:test:</text></element></root>' );
				} );

				it( `should reflect element insertion (end)`, () => {
					setData( model, '<paragraph>:test:</paragraph>' );
					model.change( writer => {
						writer.insertElement( 'softBreak', root.getChild( 0 ), 'end' );
					} );

					expect( model.data ).to.equal(
						'<root><element name="paragraph"><text>:test:</text><element name="softBreak"></element></element></root>' );
				} );

				it( `should reflect element insertion (middle)`, () => {
					setData( model, '<paragraph>:test:</paragraph>' );
					model.change( writer => {
						writer.insertElement( 'softBreak', root.getChild( 0 ), 3 );
					} );

					expect( model.data ).to.equal(
						'<root><element name="paragraph"><text>:te</text>' +
						'<element name="softBreak"></element><text>st:</text></element></root>' );
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

						expect( model.data ).to.equal( '<root><element name="paragraph"><text>3456</text></element></root>' );
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

						expect( model.data ).to.equal( '<root><element name="paragraph"><text>1234</text></element></root>' );
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

						expect( model.data ).to.equal( '<root><element name="paragraph"><text>1256</text></element></root>' );
					} );
				}

				// Element
				{
					it( `should reflect element removal (start)`, () => {
						setData( model, '<paragraph><softBreak></softBreak>123456</paragraph>' );
						model.change( writer => {
							writer.remove( root.getChild( 0 ).getChild( 0 ) );
						} );

						expect( model.data ).to.equal( '<root><element name="paragraph"><text>123456</text></element></root>' );
					} );

					it( `should reflect element removal (end)`, () => {
						setData( model, '<paragraph>123456<softBreak></softBreak></paragraph>' );
						model.change( writer => {
							writer.remove( root.getChild( 0 ).getChild( 1 ) );
						} );

						expect( model.data ).to.equal( '<root><element name="paragraph"><text>123456</text></element></root>' );
					} );

					it( `should reflect element removal (middle)`, () => {
						setData( model, '<paragraph>123<softBreak></softBreak>456</paragraph>' );
						model.change( writer => {
							writer.remove( root.getChild( 0 ).getChild( 1 ) );
						} );

						expect( model.data ).to.equal( '<root><element name="paragraph"><text>123456</text></element></root>' );
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

						expect( model.data ).to.equal(
							'<root><element name="paragraph">' +
							'<text attribs="{&quot;bold&quot;:true}">some</text><text> test text</text>' +
							'</element></root>' );
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

						expect( model.data ).to.equal(
							'<root><element name="paragraph">' +
							'<text>some test </text><text attribs="{&quot;bold&quot;:true}">text</text>' +
							'</element></root>' );
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

						expect( model.data ).to.equal(
							'<root><element name="paragraph">' +
							'<text>some </text><text attribs="{&quot;bold&quot;:true}">test</text><text> text</text>' +
							'</element></root>' );
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

						expect( model.data ).to.equal(
							'<root><element name="paragraph">' +
							'<text>so</text>' +
							'<text attribs="{&quot;bold&quot;:true}">me </text>' +
							'<text attribs="{&quot;italic&quot;:true,&quot;bold&quot;:true}">test</text>' +
							'<element name="softBreak" attribs="{&quot;bold&quot;:true}"></element>' +
							'<text attribs="{&quot;bold&quot;:true}">te</text>' +
							'<text>xt</text>' +
							'</element></root>' );
					} );
				}

				// Element
				{
					it( `should reflect element attribute insertion`, () => {
						setData( model, '<paragraph>test</paragraph><codeBlock language="java">code</codeBlock>' );
						model.change( writer => {
							writer.setAttribute( 'language', 'javascript', root.getChild( 1 ) );
						} );

						expect( model.data ).to.equal(
							'<root>' +
							'<element name="paragraph"><text>test</text></element>' +
							'<element name="codeBlock" attribs="{&quot;language&quot;:&quot;javascript&quot;}">' +
							'<text>code</text>' +
							'</element>' +
							'</root>' );
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

					expect( model.data ).to.equal(
						'<root><element name="paragraph">' +
						'<text>test </text>' +
						'<text attribs="{&quot;bold&quot;:true}">123456</text>' +
						'<text> text</text>' +
						'</element></root>' );
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

					expect( model.data ).to.equal(
						'<root>' +
						'<element name="heading3"><text>test </text><text attribs="{&quot;bold&quot;:true}">123</text></element>' +
						'<element name="paragraph"><text attribs="{&quot;bold&quot;:true}">456</text><text> text</text></element>' +
						'</root>' );
				} );
			} );

			describe( 'split()', () => {
				it( `should reflect split`, () => {
					setData( model, '<paragraph>123456</paragraph>' );
					model.change( writer => {
						writer.split( writer.createPositionAt( root.getChild( 0 ), 3 ) );
					} );

					expect( model.data ).to.equal(
						'<root><element name="paragraph"><text>123</text></element>' +
						'<element name="paragraph"><text>456</text></element></root>' );
				} );
			} );
		} );
	} );
} );
