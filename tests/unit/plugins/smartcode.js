/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import SmartCode from '../../../src/app/plugins/smartcode';
import Code from '@ckeditor/ckeditor5-basic-styles/src/code';
import CodeBlock from '@ckeditor/ckeditor5-code-block/src/codeblock';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import { createTestEditor } from '../../_util/ckeditor';
import { getData, setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';

import icon from '@ckeditor/ckeditor5-basic-styles/theme/icons/code.svg';

describe( 'Plugins', () => {
	describe( 'SmartCode', () => {
		let editor, model, button;

		{
			beforeEach( 'create test editor', () => {
				return createTestEditor( 'Test', [ SmartCode ] )
					.then( editorObjects => ( { editor, model } = editorObjects ) )
					.then( () => ( button = editor.ui.componentFactory.create( 'smartCode' ) ) );
			} );

			afterEach( 'cleanup test editor', () => {
				editor.destroy();
			} );
		}

		it( 'should require plugins', () => {
			expect( SmartCode.requires ).to.include.members( [ Code, CodeBlock ] );
		} );

		it( 'should register the ui component', () => {
			expect( button ).to.be.an.instanceOf( ButtonView );
		} );

		it( 'button should have a label', () => {
			expect( button.label ).to.be.a( 'string' );
		} );

		it( 'button should have the right icon', () => {
			expect( button.icon ).to.equals( icon );
		} );

		it( 'should have tooltip', () => {
			expect( button.tooltip ).to.be.true;
		} );

		it( 'should be a toggleable button', () => {
			expect( button.isToggleable ).to.be.true;
		} );

		describe( 'state', () => {
			it( 'should bind isEnabled to both code and codeBlock', () => {
				expect( button.isEnabled ).to.be.true;
				editor.commands.get( 'code' ).forceDisabled();
				editor.commands.get( 'codeBlock' ).forceDisabled();
				expect( button.isEnabled ).to.be.false;
			} );

			it( 'should be off outside code', () => {
				setData( model, '<paragraph>Test[]</paragraph>' );
				expect( button.isOn ).to.be.false;
			} );

			it( 'should be on inside inline code', () => {
				setData( model, '<paragraph>Test <$text code="true">code[]</$text></paragraph>' );
				expect( button.isOn ).to.be.true;
			} );

			it( 'should be on inside code block', () => {
				setData( model, '<codeBlock>Test[]</codeBlock>' );
				expect( button.isOn ).to.be.true;
			} );
		} );

		describe( 'execute', () => {
			it( 'should insert inline code', () => {
				setData( model, '<paragraph>Test [code]</paragraph>' );
				button.fire( 'execute' );
				expect( getData( model ) ).to.equal( '<paragraph>Test [<$text code="true">code</$text>]</paragraph>' );
			} );

			it( 'should remove inline code', () => {
				setData( model, '<paragraph>Test <$text code="true">[code]</$text></paragraph>' );
				button.fire( 'execute' );
				expect( getData( model ) ).to.equal( '<paragraph>Test [code]</paragraph>' );
			} );

			it( 'should insert code block', () => {
				setData( model, '<paragraph>[Test]</paragraph>' );
				button.fire( 'execute' );
				expect( getData( model ) ).to.equal( '<codeBlock language="plaintext">[Test]</codeBlock>' );
			} );

			it( 'should insert code block on multiple blocks selection', () => {
				setData( model, '<paragraph>Te[st</paragraph><paragraph>Te]st</paragraph>' );
				button.fire( 'execute' );
				expect( getData( model ) ).to.equal( '<codeBlock language="plaintext">Te[st<softBreak></softBreak>Te]st</codeBlock>' );
			} );

			it( 'should remove code block', () => {
				setData( model, '<codeBlock language="plaintext">[Test]</codeBlock>' );
				button.fire( 'execute' );
				expect( getData( model ) ).to.equal( '<paragraph>[Test]</paragraph>' );
			} );
		} );
	} );
} );
