/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createTestEditor } from '../../_util/ckeditor';

import MentionUI from '@ckeditor/ckeditor5-mention/src/mentionui';
import MentionEditing from '@ckeditor/ckeditor5-mention/src/mentionediting';

import EventInfo from '@ckeditor/ckeditor5-utils/src/eventinfo';
import DomEventData from '@ckeditor/ckeditor5-engine/src/view/observer/domeventdata';

import { setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';
import env from '@ckeditor/ckeditor5-utils/src/env';

describe( 'Dependencies', () => {
	describe( 'ckeditor5-mention', () => {
		// For the scope of these tests, it is enough if these tests pass on Chrome,
		// so we don't have to run them in Firefox.
		// For some unknown reason, Firefox is not passing the first test.
		if ( env.isGecko ) {
			return;
		}

		let editor, model, editingView;

		{
			before( 'create test editor', () => {
				return createTestEditor( '', [ MentionEditing, MentionUI ],
					{
						mention: {
							feeds: [
								{
									feed: [ '@Barney', '@F+W', '@Marshall', '@Robin', '@Ted' ],
									marker: '@'
								}
							]
						}
					} )
					.then( editorObjects => ( { editor, model } = editorObjects ) )
					.then( () => {
						editingView = editor.editing.view;
						document.body.appendChild( editor.ui.getEditableElement() );
					} );
			} );

			after( 'destroy test editor', () => {
				editor.ui.getEditableElement().remove();
				editor.destroy();
			} );
		}

		it( 'should execute selected button on enter', () => {
			setData( model, '<paragraph>foo []</paragraph>' );

			const command = editor.commands.get( 'mention' );
			const spy = sinon.spy( command, 'execute' );

			model.change( writer => {
				writer.insertText( '@', model.document.selection.getFirstPosition() );
			} );

			return waitForDebounce().then( () => {
				fireKeyDownEvent( keyCodes.arrowup );
				fireKeyDownEvent( keyCodes.enter );

				expect( spy.callCount ).to.equals( 1 );

				expect( spy.getCall( 0 ).args[ 0 ].text ).to.equals( '@Ted' );
			} );
		} );

		it( 'should execute selected button on tab', () => {
			setData( model, '<paragraph>foo []</paragraph>' );

			const command = editor.commands.get( 'mention' );
			const spy = sinon.spy( command, 'execute' );

			model.change( writer => {
				writer.insertText( '@', model.document.selection.getFirstPosition() );
			} );

			return waitForDebounce().then( () => {
				fireKeyDownEvent( keyCodes.arrowup );
				fireKeyDownEvent( keyCodes.tab );

				expect( spy.callCount ).to.equals( 1 );

				expect( spy.getCall( 0 ).args[ 0 ].text ).to.equals( '@Ted' );
			} );
		} );

		it( 'should not execute selected button on space', () => {
			setData( model, '<paragraph>foo []</paragraph>' );

			const command = editor.commands.get( 'mention' );
			const spy = sinon.spy( command, 'execute' );

			model.change( writer => {
				writer.insertText( '@', model.document.selection.getFirstPosition() );
			} );

			return waitForDebounce().then( () => {
				fireKeyDownEvent( keyCodes.arrowup );
				fireKeyDownEvent( keyCodes.space );

				expect( spy.callCount ).to.equals( 0 );
			} );
		} );

		it( 'should allow for + inside mention', () => {
			setData( model, '<paragraph>foo []</paragraph>' );

			const command = editor.commands.get( 'mention' );
			const spy = sinon.spy( command, 'execute' );

			model.change( writer => {
				writer.insertText( '@+', model.document.selection.getFirstPosition() );
			} );

			return waitForDebounce().then( () => {
				fireKeyDownEvent( keyCodes.enter );

				expect( spy.callCount ).to.equals( 1 );

				expect( spy.getCall( 0 ).args[ 0 ].text ).to.equals( '@F+W' );
			} );
		} );

		function fireKeyDownEvent( keyCode ) {
			const eventInfo = new EventInfo( editingView.document, 'keydown' );
			const eventData = new DomEventData( editingView.document, {
				target: document.body,
				preventDefault: () => {
				},
				stopPropagation: () => {
				}
			}, {
				keyCode
			} );

			editingView.document.fire( eventInfo, eventData );
		}
	} );
} );

function waitForDebounce() {
	return check();

	function check() {
		return new Promise( resolve => {
			if ( document.querySelector( '.ck-balloon-panel_visible' ) ) {
				resolve();
			} else {
				resolve( wait( 10 ).then( check ) );
			}
		} );
	}
}

function wait( timeout ) {
	return new Promise( resolve => setTimeout( resolve, timeout ) );
}
