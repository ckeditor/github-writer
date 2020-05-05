/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import SmartCaret from '../../../src/app/plugins/smartcaret';
import HorizontalLineEditing from '@ckeditor/ckeditor5-horizontal-line/src/horizontallineediting';

import { createTestEditor } from '../../_util/ckeditor';
import { getData, setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';

describe( 'Plugins', () => {
	describe( 'SmartCaret', () => {
		let editor, model;

		{
			before( 'create test editor', () => {
				return createTestEditor( '', [ SmartCaret, HorizontalLineEditing ] )
					.then( editorObjects => ( { editor, model } = editorObjects ) );
			} );

			after( 'destroy test editor', () => {
				editor.destroy();
			} );
		}

		[
			// From outside to the boundary.
			{
				key: keyCodes.arrowright,
				before: '<paragraph>test[] <$text bold="true">bold</$text></paragraph>',
				after: '<paragraph>test []<$text bold="true">bold</$text></paragraph>'
			},
			{
				key: keyCodes.arrowleft,
				before: '<paragraph><$text bold="true">bold</$text> []test</paragraph>',
				after: '<paragraph><$text bold="true">bold</$text>[] test</paragraph>'
			},

			// From inside to the boundary.
			{
				key: keyCodes.arrowright,
				before: '<paragraph><$text bold="true">bol[]d</$text> test</paragraph>',
				after: '<paragraph><$text bold="true">bold[]</$text> test</paragraph>'
			},
			{
				key: keyCodes.arrowleft,
				before: '<paragraph>test <$text bold="true">b[]old</$text></paragraph>',
				after: '<paragraph>test <$text bold="true">[]bold</$text></paragraph>'
			},

			// At the document boundaries.
			{
				key: keyCodes.arrowright,
				before: '<paragraph><$text bold="true">bold[]</$text></paragraph>',
				after: '<paragraph><$text bold="true">bold</$text>[]</paragraph>',
				noChange: true
			},
			{
				key: keyCodes.arrowleft,
				before: '<paragraph><$text bold="true">[]bold</$text></paragraph>',
				after: '<paragraph>[]<$text bold="true">bold</$text></paragraph>',
				noChange: true
			},

			// Next to soft line break.
			{
				key: keyCodes.arrowright,
				before: '<paragraph><$text bold="true">bold[]</$text><softBreak></softBreak>test</paragraph>',
				after: '<paragraph><$text bold="true">bold</$text><softBreak></softBreak>[]test</paragraph>'
			},
			{
				key: keyCodes.arrowright,
				before: '<paragraph>test[]<softBreak></softBreak><$text bold="true">bold</$text></paragraph>',
				after: '<paragraph>test<softBreak></softBreak>[]<$text bold="true">bold</$text></paragraph>'
			},
			{
				key: keyCodes.arrowleft,
				before: '<paragraph><$text bold="true">bold</$text><softBreak></softBreak>[]test</paragraph>',
				after: '<paragraph><$text bold="true">bold</$text>[]<softBreak></softBreak>test</paragraph>'
			},
			{
				key: keyCodes.arrowleft,
				before: '<paragraph>test<softBreak></softBreak><$text bold="true">[]bold</$text></paragraph>',
				after: '<paragraph>test[]<softBreak></softBreak><$text bold="true">bold</$text></paragraph>'
			},

			// From an element selection.
			{
				key: keyCodes.arrowright,
				before: '[<horizontalLine></horizontalLine>]<paragraph><$text bold="true">bold</$text></paragraph>',
				after: '<horizontalLine></horizontalLine><paragraph>[]<$text bold="true">bold</$text></paragraph>'
			},
			{
				key: keyCodes.arrowleft,
				before: '<paragraph><$text bold="true">bold</$text></paragraph>[<horizontalLine></horizontalLine>]',
				after: '<paragraph><$text bold="true">bold</$text>[]</paragraph><horizontalLine></horizontalLine>'
			},

			// Non collapsed selection at the boundaries.
			{
				key: keyCodes.arrowright,
				before: '<paragraph><$text bold="true">[bold]</$text> test</paragraph>',
				after: '<paragraph><$text bold="true">bold[]</$text> test</paragraph>'
			},
			{
				key: keyCodes.arrowleft,
				before: '<paragraph>test <$text bold="true">[bold]</$text></paragraph>',
				after: '<paragraph>test <$text bold="true">[]bold</$text></paragraph>'
			},

			// Non collapsed selection at the boundaries of document.
			{
				key: keyCodes.arrowright,
				before: '<paragraph><$text bold="true">[bold]</$text></paragraph>',
				after: '<paragraph><$text bold="true">bold[]</$text></paragraph>'
			},
			{
				key: keyCodes.arrowleft,
				before: '<paragraph><$text bold="true">[bold]</$text></paragraph>',
				after: '<paragraph><$text bold="true">[]bold</$text></paragraph>'
			},

			// Do nothing if not arrow left/right keys.
			{
				key: keyCodes.arrowup,
				before: '<paragraph><$text bold="true">bo[]ld</$text></paragraph>',
				after: '<paragraph><$text bold="true">[]bold</$text></paragraph>'
			},
			{
				key: keyCodes.arrowdown,
				before: '<paragraph><$text bold="true">bo[]ld</$text></paragraph>',
				after: '<paragraph><$text bold="true">bold[]</$text></paragraph>'
			},

			// Do nothing when keyboard modifiers are pressed.
			{
				key: keyCodes.arrowright,
				modifiers: { ctrlKey: true },
				before: '<paragraph><$text bold="true">bold[]</$text></paragraph>',
				after: '<paragraph><$text bold="true">bold[]</$text></paragraph>',
				noChange: true
			}
		].forEach( ( { key, modifiers, before, after, noChange }, index ) => {
			it( `should have the expected selection attributes (case ${ index + 1 })`, () => {
				simulatePress( key, modifiers, before, after );

				expect( getData( model ) ).to.equals( after );
			} );

			function simulatePress( keyCode, modifiers, stateBefore, stateAfter ) {
				const editable = editor.ui.getEditableElement();
				const selection = editor.model.document.selection;
				const keyEventData = { keyCode };

				modifiers && Object.assign( keyEventData, modifiers );

				// We try to simulate typing here, so we fire the selection change artificially.
				sinon.stub( selection, 'fire' );

				setData( model, stateBefore );

				editable.dispatchEvent( new KeyboardEvent( 'keydown', keyEventData ) );

				if ( !noChange ) {
					setData( model, stateAfter );

					selection.fire.restore();
					selection.fire( 'change:range', { directChange: true } );
				}
			}
		} );
	} );
} );
