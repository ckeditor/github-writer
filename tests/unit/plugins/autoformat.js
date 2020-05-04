/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import AutoFormat from '../../../src/app/plugins/autoformat';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Undo from '@ckeditor/ckeditor5-undo/src/undoediting';

import CodeEditing from '@ckeditor/ckeditor5-basic-styles/src/code/codeediting';
import StrikethroughEditing from '@ckeditor/ckeditor5-basic-styles/src/strikethrough/strikethroughediting';

import BlockQuoteEditing from '@ckeditor/ckeditor5-block-quote/src/blockquoteediting';
import CodeBlockEditing from '@ckeditor/ckeditor5-code-block/src/codeblockediting';
import HeadingCommand from '@ckeditor/ckeditor5-heading/src/headingcommand';
import HeadingEditing from '@ckeditor/ckeditor5-heading/src/headingediting';
import HorizontalLineEditing from '@ckeditor/ckeditor5-horizontal-line/src/horizontallineediting';
import ListEditing from '@ckeditor/ckeditor5-list/src/listediting';

import { setData, getData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { createTestEditor } from '../../_util/ckeditor';

describe( 'Plugins', () => {
	describe( 'AutoFormat', () => {
		let editor, model;

		{
			beforeEach( 'create test editor', () => {
				return createTestEditor( '', [ AutoFormat,
					CodeEditing, StrikethroughEditing,
					HorizontalLineEditing, BlockQuoteEditing, HeadingEditing, CodeBlockEditing, ListEditing,
					Undo
				] )
					.then( editorObjects => {
						editor = editorObjects.editor;
						model = editorObjects.model;

						// This editor has no DOM, so this method must be stubbed for all tests.
						// Otherwise it will throw as it accesses the DOM to do its job.
						sinon.stub( editor.editing.view, 'scrollToTheSelection' );
					} );
			} );

			afterEach( 'cleanup test editor', () => {
				editor.destroy();
			} );
		}

		{
			// Inline

			testAutoFormatting( 'Inline', [
				{
					before: '<paragraph>**foobar*[]</paragraph>',
					key: '*',
					after: '<paragraph><$text bold="true">foobar</$text>[]</paragraph>'
				},
				{
					before: '<paragraph>__foobar_[]</paragraph>',
					key: '_',
					after: '<paragraph><$text bold="true">foobar</$text>[]</paragraph>'
				},
				{
					before: '<paragraph>_foobar[]</paragraph>',
					key: '_',
					after: '<paragraph><$text italic="true">foobar</$text>[]</paragraph>'
				},
				{
					before: '<paragraph>*foobar[]</paragraph>',
					key: '*',
					after: '<paragraph><$text italic="true">foobar</$text>[]</paragraph>'
				},
				{
					before: '<paragraph>`foobar[]</paragraph>',
					key: '`',
					after: '<paragraph><$text code="true">foobar</$text>[]</paragraph>'
				},
				{
					before: '<paragraph>~foobar[]</paragraph>',
					key: '~',
					after: '<paragraph><$text strikethrough="true">foobar</$text>[]</paragraph>'
				},
				{
					before: '<paragraph>`x[]</paragraph>',
					key: '`',
					after: '<paragraph><$text code="true">x</$text>[]</paragraph>'
				},
				{
					before: '<paragraph>foo `x[] bar</paragraph>',
					key: '`',
					after: '<paragraph>foo <$text code="true">x</$text>[] bar</paragraph>'
				}
			] );

			testAutoFormatting( 'Inline inside text', [
				{
					before: '<paragraph>foo **bar*[] baz</paragraph>',
					key: '*',
					after: '<paragraph>foo <$text bold="true">bar</$text>[] baz</paragraph>'
				},
				{
					before: '<paragraph>foo _bar[] baz</paragraph>',
					key: '_',
					after: '<paragraph>foo <$text italic="true">bar</$text>[] baz</paragraph>'
				}
			] );

			testAutoFormatting( 'Inline next to punctuation', [
				{
					before: '<paragraph>foo **bar*[], baz</paragraph>',
					key: '*',
					after: '<paragraph>foo <$text bold="true">bar</$text>[], baz</paragraph>'
				},
				{
					before: '<paragraph>foo _bar[]. baz</paragraph>',
					key: '_',
					after: '<paragraph>foo <$text italic="true">bar</$text>[]. baz</paragraph>'
				},
				{
					before: '<paragraph>foo `bar[]? baz</paragraph>',
					key: '`',
					after: '<paragraph>foo <$text code="true">bar</$text>[]? baz</paragraph>'
				}
			] );

			testAutoFormatting( 'Inline with soft-break', [
				{
					before: '<paragraph>foo<softBreak></softBreak>**barbaz*[]</paragraph>',
					key: '*',
					after: '<paragraph>foo<softBreak></softBreak><$text bold="true">barbaz</$text>[]</paragraph>'
				},
				{
					before: '<paragraph>foo **bar*[]<softBreak></softBreak>baz</paragraph>',
					key: '*',
					after: '<paragraph>foo <$text bold="true">bar</$text>[]<softBreak></softBreak>baz</paragraph>'
				}
			] );

			testAutoFormatting( 'Inline, do nothing when first marker typing', [
				{
					before: '<paragraph>foobar*[]</paragraph>',
					key: '*',
					after: '<paragraph>foobar**[]</paragraph>'
				},
				{
					before: '<paragraph>foobar[]</paragraph>',
					key: '*',
					after: '<paragraph>foobar*[]</paragraph>'
				},
				{
					before: '<paragraph>foobar[]</paragraph>',
					key: '_',
					after: '<paragraph>foobar_[]</paragraph>'
				}
			] );

			testAutoFormatting( 'Inline, mixed styles', [
				{
					before: '<paragraph>**foo <$text italic="true">bar</$text>baz*[]</paragraph>',
					key: '*',
					after: '<paragraph><$text bold="true">foo </$text>' +
						'<$text bold="true" italic="true">bar</$text><$text bold="true">baz</$text>[]</paragraph>'
				},
				{
					before: '<paragraph><$text italic="true">foo **bar</$text>baz*[]</paragraph>',
					key: '*',
					after: '<paragraph><$text italic="true">foo **bar</$text>baz**[]</paragraph>'
				},
				{
					before: '<paragraph><$text italic="true">foo **bar</$text><$text strikethrough="true">baz*[]</$text></paragraph>',
					key: '*',
					attribs: { strikethrough: true }, // For an unknown reason, it doesn't work if we don't set attributes as well.
					after: '<paragraph><$text italic="true">foo **bar</$text><$text strikethrough="true">baz**[]</$text></paragraph>'
				}
			] );

			testAutoFormatting( 'Inline, do not match cases', [
				{
					before: '<paragraph>_ foo baz[]</paragraph>',
					key: '_',
					after: '<paragraph>_ foo baz_[]</paragraph>'
				},
				{
					before: '<paragraph>_foo baz []</paragraph>',
					key: '_',
					after: '<paragraph>_foo baz _[]</paragraph>'
				}
			] );

			// Block

			testAutoFormatting( 'Horizontal line', [
				{
					before: '<paragraph>--[]</paragraph>',
					key: '-',
					after: '<horizontalLine></horizontalLine><paragraph>[]</paragraph>'
				},
				{
					before: '<paragraph>-[]</paragraph>',
					key: '-',
					after: '<paragraph>--[]</paragraph>'
				}
			] );

			testAutoFormatting( 'Bulleted list', [
				{
					before: '<paragraph>*[]</paragraph>',
					key: ' ',
					after: '<listItem listIndent="0" listType="bulleted">[]</listItem>'
				},
				{
					before: '<paragraph>-[]</paragraph>',
					key: ' ',
					after: '<listItem listIndent="0" listType="bulleted">[]</listItem>'
				},
				{
					before: '<listItem listIndent="0" listType="bulleted">-[]</listItem>',
					key: ' ',
					after: '<listItem listIndent="0" listType="bulleted">- []</listItem>'
				},
				{
					before: '<paragraph>Foo<softBreak></softBreak>*[]</paragraph>',
					key: ' ',
					after: '<paragraph>Foo<softBreak></softBreak>* []</paragraph>'
				}
			] );

			testAutoFormatting( 'Numbered list', [
				{
					before: '<paragraph>1.[]</paragraph>',
					key: ' ',
					after: '<listItem listIndent="0" listType="numbered">[]</listItem>'
				},
				{
					before: '<paragraph>1)[]</paragraph>',
					key: ' ',
					after: '<listItem listIndent="0" listType="numbered">[]</listItem>'
				},
				{
					before: '<paragraph>1[]</paragraph>',
					key: ' ',
					after: '<paragraph>1 []</paragraph>'
				},
				{
					before: '<listItem listIndent="0" listType="numbered">1.[]</listItem>',
					key: ' ',
					after: '<listItem listIndent="0" listType="numbered">1. []</listItem>'
				},
				{
					before: '<paragraph>3.[]</paragraph>',
					key: ' ',
					after: '<paragraph>3. []</paragraph>'
				},
				{
					before: '<paragraph>Foo<softBreak></softBreak>1.[]</paragraph>',
					key: ' ',
					after: '<paragraph>Foo<softBreak></softBreak>1. []</paragraph>'
				}
			] );

			testAutoFormatting( 'Block quote', [
				{
					before: '<paragraph>>[]</paragraph>',
					key: ' ',
					after: '<blockQuote><paragraph>[]</paragraph></blockQuote>'
				},
				{
					before: '<heading1>>[]</heading1>',
					key: ' ',
					after: '<heading1>> []</heading1>'
				},
				{
					before: '<listItem listIndent="0" listType="numbered">1. >[]</listItem>',
					key: ' ',
					after: '<listItem listIndent="0" listType="numbered">1. > []</listItem>'
				},
				{
					before: '<listItem listIndent="0" listType="bulleted">1. >[]</listItem>',
					key: ' ',
					after: '<listItem listIndent="0" listType="bulleted">1. > []</listItem>'
				},
				{
					before: '<paragraph>Foo<softBreak></softBreak>>[]</paragraph>',
					key: ' ',
					after: '<paragraph>Foo<softBreak></softBreak>> []</paragraph>'
				}
			] );

			testAutoFormatting( 'Code block', [
				{
					before: '<paragraph>``[]</paragraph>',
					key: '`',
					after: '<codeBlock language="plaintext">[]</codeBlock>'
				},
				{
					before: '<codeBlock language="plaintext">``[]</codeBlock>',
					key: '`',
					after: '<codeBlock language="plaintext">```[]</codeBlock>'
				},
				{
					before: '<heading1>``[]</heading1>',
					key: '`',
					after: '<heading1>```[]</heading1>'
				},
				{
					before: '<listItem listIndent="0" listType="numbered">1. ``[]</listItem>',
					key: '`',
					after: '<listItem listIndent="0" listType="numbered">1. ```[]</listItem>'
				},
				{
					before: '<listItem listIndent="0" listType="bulleted">1. ``[]</listItem>',
					key: '`',
					after: '<listItem listIndent="0" listType="bulleted">1. ```[]</listItem>'
				}
			] );

			testAutoFormatting( 'Heading', [
				{
					before: '<paragraph>#[]</paragraph>',
					key: ' ',
					after: '<heading1>[]</heading1>'
				},
				{
					before: '<paragraph>##[]</paragraph>',
					key: ' ',
					after: '<heading2>[]</heading2>'
				},
				{
					before: '<heading1>#[]</heading1>',
					key: ' ',
					after: '<heading1># []</heading1>'
				},
				{
					before: '<paragraph>Foo<softBreak></softBreak>#[]</paragraph>',
					key: ' ',
					after: '<paragraph>Foo<softBreak></softBreak># []</paragraph>'
				}
			] );

			testAutoFormatting( 'Block with contents', [
				{
					before: '<paragraph>>[]test</paragraph>',
					key: ' ',
					after: '<blockQuote><paragraph>[]test</paragraph></blockQuote>'
				},
				{
					before: '<paragraph>*[]test</paragraph>',
					key: ' ',
					after: '<listItem listIndent="0" listType="bulleted">[]test</listItem>'
				},
				{
					before: '<paragraph>1.[]test</paragraph>',
					key: ' ',
					after: '<listItem listIndent="0" listType="numbered">[]test</listItem>'
				},
				{
					before: '<paragraph>``[]test</paragraph>',
					key: '`',
					after: '<codeBlock language="plaintext">[]test</codeBlock>'
				},
				{
					before: '<paragraph>``[]test <$text bold="true">bold</$text></paragraph>',
					key: '`',
					after: '<codeBlock language="plaintext">[]test bold</codeBlock>'
				},
				{
					before: '<paragraph>--[]test</paragraph>',
					key: '-',
					after: '<horizontalLine></horizontalLine><paragraph>[]test</paragraph>'
				},
				{
					before: '<paragraph>#[]test</paragraph>',
					key: ' ',
					after: '<heading1>[]test</heading1>'
				},
				{
					before: '<paragraph>##[]test</paragraph>',
					key: ' ',
					after: '<heading2>[]test</heading2>'
				},
				{
					before: '<heading1>#[]test</heading1>',
					key: ' ',
					after: '<heading1># []test</heading1>'
				},
				{
					before: '<paragraph>#[]Foo<softBreak></softBreak></paragraph>',
					key: ' ',
					after: '<heading1>[]Foo<softBreak></softBreak></heading1>'
				}
			] );

			// Other

			testAutoFormatting( 'No effect inside code', [
				{
					before: '<paragraph><$text code="true">foo _bar[] baz</$text></paragraph>',
					key: '_',
					attribs: { code: true }, // For an unknown reason, it doesn't work if we don't set attributes as well.
					after: '<paragraph><$text code="true">foo _bar_[] baz</$text></paragraph>'
				},
				{
					before: '<paragraph><$text code="true">--[]</$text></paragraph>',
					key: '-',
					attribs: { code: true }, // For an unknown reason, it doesn't work if we don't set attributes as well.
					after: '<paragraph><$text code="true">---[]</$text></paragraph>'
				},
				{
					before: '<codeBlock>foo _bar[] baz</codeBlock>',
					key: '_',
					after: '<codeBlock>foo _bar_[] baz</codeBlock>'
				},
				{
					before: '<codeBlock>--[]</codeBlock>',
					key: '-',
					after: '<codeBlock>---[]</codeBlock>'
				}
			] );

			testAutoFormatting( 'Do nothing at the beginning of paragraph', [
				{
					before: '<paragraph>[]</paragraph>',
					key: '_',
					after: '<paragraph>_[]</paragraph>'
				}
			] );

			function testAutoFormatting( suite, tests ) {
				describe( suite, () => {
					tests.forEach( ( testCase, index ) => {
						it( `should pass test ${ index + 1 }`, () => {
							setData( model, testCase.before );
							model.change( writer => {
								if ( testCase.attribs ) {
									writer.insertText( testCase.key, testCase.attribs, model.document.selection.getFirstPosition() );
								} else {
									writer.insertText( testCase.key, model.document.selection.getFirstPosition() );
								}
							} );

							expect( getData( model ) ).to.equal( testCase.after );
						} );
					} );
				} );
			}
		}

		describe( 'Heading', () => {
			it( 'should work with heading1-heading6 commands regardless of the config of the heading feature', () => {
				const command = new HeadingCommand( editor, [ 'heading1', 'heading6' ] );

				const spy = sinon.spy( command, 'execute' );

				function HeadingPlugin( editor ) {
					editor.commands.add( 'heading', command );
					command.refresh();
				}

				return createTestEditor( '', [ Paragraph, AutoFormat, HeadingPlugin ] )
					.then( ( { editor, model } ) => {
						setData( model, '<paragraph>#[]</paragraph>' );
						model.change( writer => {
							writer.insertText( ' ', model.document.selection.getFirstPosition() );
						} );

						sinon.assert.calledOnce( spy );
						sinon.assert.calledWithExactly( spy, { value: 'heading1' } );

						spy.resetHistory();

						setData( model, '<paragraph>######[]</paragraph>' );
						model.change( writer => {
							writer.insertText( ' ', model.document.selection.getFirstPosition() );
						} );

						sinon.assert.calledOnce( spy );
						sinon.assert.calledWithExactly( spy, { value: 'heading6' } );

						return editor.destroy();
					} );
			} );

			it( 'should not replace if heading command is disabled', () => {
				setData( model, '<paragraph>#[]</paragraph>' );

				model.change( writer => {
					editor.commands.get( 'heading' ).refresh = () => {
					};
					editor.commands.get( 'heading' ).isEnabled = false;

					writer.insertText( ' ', model.document.selection.getFirstPosition() );
				} );

				expect( getData( model ) ).to.equal( '<paragraph># []</paragraph>' );
			} );
		} );

		it( 'should do nothing when missing plugins', () => {
			return createTestEditor( '', [ Paragraph, AutoFormat ] )
				.then( ( { editor, model } ) => {
					setData( model, '<paragraph>Test ~case[]</paragraph>' );
					model.change( writer => {
						writer.insertText( '~', model.document.selection.getFirstPosition() );
					} );

					expect( getData( model ) ).to.equal( '<paragraph>Test ~case~[]</paragraph>' );

					setData( model, '<paragraph>--[]</paragraph>' );
					model.change( writer => {
						writer.insertText( '-', model.document.selection.getFirstPosition() );
					} );

					expect( getData( model ) ).to.equal( '<paragraph>---[]</paragraph>' );

					return editor.destroy(); // Test cleanup.
				} );
		} );

		it( 'should not format if the command is not enabled', () => {
			// Inline command.
			editor.commands.get( 'code' ).forceDisabled( 'test' );

			setData( model, '<paragraph>`foobar[]</paragraph>' );

			model.change( writer => {
				writer.insertText( '`', model.document.selection.getFirstPosition() );
			} );

			expect( getData( model ) ).to.equal( '<paragraph>`foobar`[]</paragraph>' );

			// Block command.
			editor.commands.get( 'horizontalLine' ).forceDisabled( 'test' );

			setData( model, '<paragraph>--[]</paragraph>' );

			model.change( writer => {
				writer.insertText( '-', model.document.selection.getFirstPosition() );
			} );

			expect( getData( model ) ).to.equal( '<paragraph>---[]</paragraph>' );
		} );

		it( 'should do nothing if no auto-formatters registered', () => {
			editor.autoFormat.clear();

			// Inline command.
			editor.commands.get( 'code' ).forceDisabled( 'test' );

			setData( model, '<paragraph>`foobar[]</paragraph>' );

			model.change( writer => {
				writer.insertText( '`', model.document.selection.getFirstPosition() );
			} );

			expect( getData( model ) ).to.equal( '<paragraph>`foobar`[]</paragraph>' );

			// Block command.
			editor.commands.get( 'horizontalLine' ).forceDisabled( 'test' );

			setData( model, '<paragraph>--[]</paragraph>' );

			model.change( writer => {
				writer.insertText( '-', model.document.selection.getFirstPosition() );
			} );

			expect( getData( model ) ).to.equal( '<paragraph>---[]</paragraph>' );
		} );

		// Undo integration.
		{
			testUndo( 'Undo inline', [
				{
					before: '<paragraph>**foobar*[]</paragraph>',
					key: '*',
					after: '<paragraph><$text bold="true">foobar</$text>[]</paragraph>'
				},
				{
					before: '<paragraph>_foobar[]</paragraph>',
					key: '_',
					after: '<paragraph><$text italic="true">foobar</$text>[]</paragraph>'
				},
				{
					before: '<paragraph>`foobar[]</paragraph>',
					key: '`',
					after: '<paragraph><$text code="true">foobar</$text>[]</paragraph>'
				}
			] );

			testUndo( 'Undo block', [
				{
					before: '<paragraph>*[]</paragraph>',
					key: ' ',
					after: '<listItem listIndent="0" listType="bulleted">[]</listItem>'
				},
				{
					before: '<paragraph>-[]</paragraph>',
					key: ' ',
					after: '<listItem listIndent="0" listType="bulleted">[]</listItem>'
				},
				{
					before: '<paragraph>1.[]</paragraph>',
					key: ' ',
					after: '<listItem listIndent="0" listType="numbered">[]</listItem>'
				},
				{
					before: '<paragraph>1)[]</paragraph>',
					key: ' ',
					after: '<listItem listIndent="0" listType="numbered">[]</listItem>'
				},
				{
					before: '<paragraph>#[]</paragraph>',
					key: ' ',
					after: '<heading1>[]</heading1>'
				},
				{
					before: '<paragraph>##[]</paragraph>',
					key: ' ',
					after: '<heading2>[]</heading2>'
				},
				{
					before: '<paragraph>>[]</paragraph>',
					key: ' ',
					after: '<blockQuote><paragraph>[]</paragraph></blockQuote>'
				}
			] );

			function testUndo( suite, tests ) {
				describe( suite, () => {
					tests.forEach( ( testCase, index ) => {
						it( `should pass test ${ index + 1 }`, () => {
							setData( model, testCase.before );
							model.change( writer => {
								writer.insertText( testCase.key, model.document.selection.getFirstPosition() );
							} );

							expect( getData( model ) ).to.equal( testCase.after );
							editor.execute( 'undo' );
							expect( getData( model ) ).to.equal( testCase.before.replace( '[]', testCase.key + '[]' ) );
						} );
					} );
				} );
			}
		}
	} );
} );
