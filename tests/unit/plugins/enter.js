/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Enter from '../../../src/app/plugins/enter';

import DomEventData from '@ckeditor/ckeditor5-engine/src/view/observer/domeventdata';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';

import { getData, setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { createTestEditor } from '../../_util/ckeditor';

describe( 'Plugins', () => {
	describe( 'Enter', () => {
		let editor, model;

		{
			beforeEach( 'create test editor', () => {
				return createTestEditor( '', [ Enter ] )
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

		it( 'should not block enter', () => {
			setData( model, '<paragraph>Test[]</paragraph>' );

			const viewDocument = editor.editing.view.document;

			viewDocument.fire( 'keydown',
				new DomEventData( viewDocument, new Event( 'keydown' ),
					{ keyCode: keyCodes.enter } ) );

			expect( getData( model ) ).to.equal( '<paragraph>Test</paragraph><paragraph>[]</paragraph>' );
		} );

		it( 'should not block shift+enter', () => {
			setData( model, '<paragraph>Test[]</paragraph>' );

			const viewDocument = editor.editing.view.document;

			viewDocument.fire( 'keydown',
				new DomEventData( viewDocument, new Event( 'keydown' ),
					{ keyCode: keyCodes.enter, shiftKey: true } ) );

			expect( getData( model ) ).to.equal( '<paragraph>Test<softBreak></softBreak>[]</paragraph>' );
		} );

		[
			{ name: 'alt+enter', keyCode: keyCodes.enter, altKey: true },
			{ name: 'ctrl+enter', keyCode: keyCodes.enter, ctrlKey: true },
			{ name: 'cmd+enter', keyCode: keyCodes.enter, metaKey: true },
			{ name: 'alt+shift+enter', keyCode: keyCodes.enter, shiftKey: true, altKey: true },
			{ name: 'ctrl+shift+enter', keyCode: keyCodes.enter, shiftKey: true, ctrlKey: true },
			{ name: 'cmd+shift+enter', keyCode: keyCodes.enter, shiftKey: true, metaKey: true }
		].forEach( keystroke => {
			it( `should block ${ keystroke.name }`, () => {
				setData( model, '<paragraph>Test[]</paragraph>' );

				const viewDocument = editor.editing.view.document;

				delete keystroke.name;
				const domEvent = new Event( 'keydown' );
				Object.assign( domEvent, keystroke );

				viewDocument.fire( 'keydown',
					new DomEventData( viewDocument, domEvent,
						keystroke ) );

				expect( getData( model ) ).to.equal( '<paragraph>Test[]</paragraph>' );
			} );
		} );
	} );
} );
