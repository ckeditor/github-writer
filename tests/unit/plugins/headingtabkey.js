/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import HeadingTabKey, { ChangeHeadingLevelCommand } from '../../../src/app/plugins/headingtabkey';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';

import { createTestEditor } from '../../_util/ckeditor';
import DomEventData from '@ckeditor/ckeditor5-engine/src/view/observer/domeventdata';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';
import { getData, setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';

describe( 'Plugins', () => {
	describe( 'HeadingTabKey', () => {
		let editor, model;

		{
			beforeEach( 'create test editor', () => {
				return createTestEditor( '', [ HeadingTabKey, Heading ], {
					heading: {
						options: [
							{ model: 'paragraph', title: 'Paragraph' },
							{ model: 'heading1', view: 'h1', title: 'Heading 1' },
							{ model: 'heading2', view: 'h2', title: 'Heading 2' },
							{ model: 'heading3', view: 'h3', title: 'Heading 3' }
						]
					}
				} )
					.then( editorObjects => ( { editor, model } = editorObjects ) );
			} );

			afterEach( 'cleanup test editor', () => {
				editor.destroy();
			} );
		}

		function pressKey( keyInfo ) {
			const document = editor.editing.view.document;

			const eventInfo = new DomEventData( document, new Event( 'keydown' ), keyInfo );
			sinon.spy( eventInfo, 'preventDefault' );

			document.fire( 'keydown', eventInfo );

			return eventInfo.preventDefault.called;
		}

		it( 'should do nothing if heading is not included', () => {
			return createTestEditor( '', [ HeadingTabKey ] )
				.then( ( { editor } ) => {
					expect( editor.commands.get( 'decreaseHeading' ) ).to.be.undefined;
					expect( editor.commands.get( 'increaseHeading' ) ).to.be.undefined;

					return editor.destroy(); // Test cleanup.
				} );
		} );

		it( 'should register commands', () => {
			expect( editor.commands.get( 'decreaseHeading' ) ).to.be.an.instanceOf( ChangeHeadingLevelCommand );
			expect( editor.commands.get( 'increaseHeading' ) ).to.be.an.instanceOf( ChangeHeadingLevelCommand );
		} );

		it( 'should decreaseHeading.execute() on tab', () => {
			setData( model, '<heading2>Test[]</heading2>' );

			const spy = sinon.spy( editor.commands.get( 'decreaseHeading' ), 'execute' );
			pressKey( { keyCode: keyCodes.tab } );
			expect( spy.callCount ).to.equals( 1 );
		} );

		it( 'should increaseHeading.execute() on shift+tab', () => {
			const spy = sinon.spy( editor.commands.get( 'increaseHeading' ), 'execute' );
			pressKey( { keyCode: keyCodes.tab, shiftKey: true } );
			expect( spy.callCount ).to.equals( 1 );
		} );

		it( 'should set the decreaseHeading command state', () => {
			const command = editor.commands.get( 'decreaseHeading' );

			setData( model, '<heading1>Test[]</heading1>' );
			expect( command.isEnabled ).to.be.true;

			setData( model, '<heading3>Test[]</heading3>' );
			expect( command.isEnabled ).to.be.false;

			setData( model, '<paragraph>Test[]</paragraph>' );
			expect( command.isEnabled ).to.be.false;
		} );

		it( 'should set the increaseHeading command state', () => {
			const command = editor.commands.get( 'increaseHeading' );

			setData( model, '<heading1>Test[]</heading1>' );
			expect( command.isEnabled ).to.be.false;

			setData( model, '<heading3>Test[]</heading3>' );
			expect( command.isEnabled ).to.be.true;

			setData( model, '<paragraph>Test[]</paragraph>' );
			expect( command.isEnabled ).to.be.false;
		} );

		[
			{
				name: 'should decrease on tab',
				command: 'decreaseHeading',
				key: { keyCode: keyCodes.tab },
				before: '<heading2>Test[]</heading2>',
				after: '<heading3>Test[]</heading3>'
			},
			{
				name: 'should increase on shift+tab',
				command: 'increaseHeading',
				key: { keyCode: keyCodes.tab, shiftKey: true },
				before: '<heading2>Test[]</heading2>',
				after: '<heading1>Test[]</heading1>'
			},
			{
				name: 'should do nothing on tab at boundary',
				command: 'decreaseHeading',
				key: { keyCode: keyCodes.tab },
				before: '<heading3>Test[]</heading3>',
				after: '<heading3>Test[]</heading3>'
			},
			{
				name: 'should do nothing on shift+tab at boundary',
				command: 'increaseHeading',
				key: { keyCode: keyCodes.tab, shiftKey: true },
				before: '<heading1>Test[]</heading1>',
				after: '<heading1>Test[]</heading1>'
			},
			{
				name: 'should do nothing on tab not in heading',
				command: 'decreaseHeading',
				key: { keyCode: keyCodes.tab },
				before: '<paragraph>Test[]</paragraph>',
				after: '<paragraph>Test[]</paragraph>'
			},
			{
				name: 'should do nothing on shift+tab not in heading',
				command: 'increaseHeading',
				key: { keyCode: keyCodes.tab, shiftKey: true },
				before: '<paragraph>Test[]</paragraph>',
				after: '<paragraph>Test[]</paragraph>'
			},
			{
				name: 'should do nothing on multi-block selection',
				command: 'decreaseHeading',
				key: { keyCode: keyCodes.tab },
				before: '<heading2>[Test</heading2><paragraph>Test]</paragraph>',
				after: '<heading2>[Test</heading2><paragraph>Test]</paragraph>'
			}
		].forEach( entry => {
			it( entry.name, () => {
				setData( model, entry.before );
				const cancelled = pressKey( entry.key );
				expect( cancelled ).to.be[ entry.after !== entry.before ];
				expect( getData( model ) ).to.equal( entry.after );
			} );

			it( entry.name + ' (command)', () => {
				setData( model, entry.before );
				editor.commands.get( entry.command ).execute();
				expect( getData( model ) ).to.equal( entry.after );
			} );
		} );
	} );
} );
