/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import CodeBlockLanguageSelector, {
	CodeBlockLanguageSelectorCommand,
	LanguageSelector,
	LanguageSelectorButtonView,
	LanguageSelectorBalloonView,
	LanguageSearchView
} from '../../../src/app/plugins/codeblocklanguageselector';

import CodeBlock from '@ckeditor/ckeditor5-code-block/src/codeblock';

import FilteredListView from '../../../src/app/modules/filteredlistview';
import BalloonPanelView from '@ckeditor/ckeditor5-ui/src/panel/balloon/balloonpanelview';
import DropdownButtonView from '@ckeditor/ckeditor5-ui/src/dropdown/button/dropdownbuttonview';
import UIElement from '@ckeditor/ckeditor5-engine/src/view/uielement';

import { createTestEditor, fakeLocale as locale } from '../../_util/ckeditor';
import { setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';

describe( 'Plugins', () => {
	describe( 'CodeBlockLanguageSelector', () => {
		describe( 'Plugin', () => {
			it( 'should require plugins', () => {
				expect( CodeBlockLanguageSelector.requires ).to.include( CodeBlock );
			} );

			describe( 'init()', () => {
				let editor, model;

				beforeEach( () => {
					return createTestEditor( '', [ CodeBlock, CodeBlockLanguageSelector ] )
						.then( editorObjects => ( { editor, model } = editorObjects ) );
				} );

				afterEach( () => {
					editor.destroy();
				} );

				describe( 'DowncastDispatcher integration', () => {
					it( 'should inject the button on data loading', () => {
						setData( model, '<codeBlock language="javascript">[]</codeBlock>' );

						const button = editor.ui.view.editable.element.querySelector( 'pre > button.ck-codeblock-language-button' );

						expect( button ).to.exist;
						expect( button.querySelector( '.ck-button__label' ).textContent ).to.equals( 'JavaScript' );
					} );

					it( 'should inject the button on data loading (unknown language)', () => {
						setData( model, '<codeBlock language="unknown-language">[]</codeBlock>' );

						const button = editor.ui.view.editable.element.querySelector( 'pre > button.ck-codeblock-language-button' );

						expect( button ).to.exist;
						expect( button.querySelector( '.ck-button__label' ).textContent ).to.equals( 'unknown-language' );
					} );

					it( 'should inject the button on new code-block', () => {
						editor.model.change( writer => {
							const root = editor.model.document.getRoot();
							writer.insertElement( 'codeBlock', { language: 'javascript' }, root, 0 );
						} );

						const button = editor.ui.view.editable.element.querySelector( 'pre > button.ck-codeblock-language-button' );

						expect( button ).to.exist;
						expect( button.querySelector( '.ck-button__label' ).textContent ).to.equals( 'JavaScript' );
					} );

					it( 'should not inject the button on suggestion', () => {
						editor.model.change( writer => {
							const root = editor.model.document.getRoot();
							writer.insertElement( 'codeBlock', { language: 'suggestion' }, root, 0 );
						} );

						const button = editor.ui.view.editable.element.querySelector( 'pre > button.ck-codeblock-language-button' );

						expect( button ).to.not.exist;
					} );

					it( 'should update the button on attribute change', () => {
						setData( model, '<codeBlock language="javascript">[]</codeBlock>' );

						editor.model.change( writer => {
							const codeBlock = editor.model.document.getRoot().getChild( 0 );
							writer.setAttribute( 'language', 'php', codeBlock );
						} );

						const button = editor.ui.view.editable.element.querySelector( 'pre > button.ck-codeblock-language-button' );

						expect( button ).to.exist;
						expect( button.querySelector( '.ck-button__label' ).textContent ).to.equals( 'PHP' );
					} );

					it( 'should update the button on attribute change (unknown language)', () => {
						setData( model, '<codeBlock language="javascript">[]</codeBlock>' );

						editor.model.change( writer => {
							const codeBlock = editor.model.document.getRoot().getChild( 0 );
							writer.setAttribute( 'language', 'unknown-language', codeBlock );
						} );

						const button = editor.ui.view.editable.element.querySelector( 'pre > button.ck-codeblock-language-button' );

						expect( button ).to.exist;
						expect( button.querySelector( '.ck-button__label' ).textContent ).to.equals( 'unknown-language' );
					} );

					it( 'should destroy the button on element removal', () => {
						setData( model, '<codeBlock language="javascript">[]</codeBlock>' );

						const spy = sinon.spy( LanguageSelector.prototype, 'destroy' );

						editor.model.change( writer => {
							const codeBlock = editor.model.document.getRoot().getChild( 0 );
							writer.remove( codeBlock );
						} );

						expect( spy.callCount ).to.equals( 1 );
					} );

					it( 'should do nothing when removing a suggestion', () => {
						setData( model, '<codeBlock language="suggestion">[]</codeBlock>' );

						const spy = sinon.spy( LanguageSelector.prototype, 'destroy' );

						editor.model.change( writer => {
							const codeBlock = editor.model.document.getRoot().getChild( 0 );
							writer.remove( codeBlock );
						} );

						expect( spy.callCount ).to.equals( 0 );
					} );

					it( 'should update the button the "language" event', () => {
						// Using sinon to catch the LanguageSelector instance.
						const spy = sinon.spy( LanguageSelector.prototype, 'listenTo' );

						setData( model, '<codeBlock language="javascript">[]</codeBlock>' );
						expect( spy.callCount ).to.equals( 1 );

						const selector = spy.thisValues[ 0 ];
						expect( selector ).to.be.an.instanceOf( LanguageSelector );

						const button = editor.ui.view.editable.element.querySelector( 'pre > button.ck-codeblock-language-button' );
						expect( button ).to.exist;

						editor.focus = sinon.stub();

						// Case 1: using a full language name.
						selector.fire( 'language', 'PHP' );
						expect( editor.focus.callCount ).to.equals( 1 );
						expect( button.querySelector( '.ck-button__label' ).textContent ).to.equals( 'PHP' );

						// Case 1: using an alias.
						selector.fire( 'language', 'js' );
						expect( editor.focus.callCount ).to.equals( 2 );
						expect( button.querySelector( '.ck-button__label' ).textContent ).to.equals( 'JavaScript' );
					} );
				} );

				describe( 'command', () => {
					it( 'should register the "codeBlockLanguageSelector" command', () => {
						expect( editor.commands.get( 'codeBlockLanguageSelector' ) )
							.to.be.an.instanceOf( CodeBlockLanguageSelectorCommand );
					} );

					it( 'should register a keyboard shortcut', () => {
						setData( model, '<codeBlock>[]</codeBlock>' );

						const stub = sinon.stub( editor.commands.get( 'codeBlockLanguageSelector' ), 'execute' );

						const evt = new KeyboardEvent( 'keydown',
							{ ctrlKey: true, shiftKey: true, keyCode: 76 /* L */ } );
						editor.ui.view.editable.element.dispatchEvent( evt );

						expect( stub.callCount ).to.equals( 1 );
					} );

					it( 'should update the button the "language" event', () => {
						// Using sinon to catch the LanguageSelector instance.
						const spy = sinon.spy( LanguageSelector.prototype, 'listenTo' );

						setData( model, '<codeBlock language="javascript">[]</codeBlock>' );
						expect( spy.callCount ).to.equals( 1 );

						const selector = spy.thisValues[ 0 ];
						expect( selector ).to.be.an.instanceOf( LanguageSelector );

						const stub = sinon.stub( selector, 'execute' );

						editor.commands.get( 'codeBlockLanguageSelector' ).execute();

						expect( stub.callCount ).to.equals( 1 );
					} );
				} );
			} );
		} );

		describe( 'CodeBlockLanguageSelectorCommand', () => {
			let editor, model, command;

			beforeEach( () => {
				return createTestEditor( '', [ CodeBlock, CodeBlockLanguageSelector ] )
					.then( editorObjects => ( { editor, model } = editorObjects ) )
					.then( () => ( command = new CodeBlockLanguageSelectorCommand( editor ) ) );
			} );

			afterEach( () => {
				editor.destroy();
			} );

			it( 'should be enabled inside code-block', () => {
				setData( model, '<codeBlock>[]</codeBlock>' );
				expect( command.isEnabled ).to.be.true;
			} );

			it( 'should be disabled outside code-block', () => {
				setData( model, '<paragraph>[]</paragraph>' );
				expect( command.isEnabled ).to.be.false;
			} );

			it( 'should be disabled inside suggestions', () => {
				setData( model, '<codeBlock language="suggestion">[]</codeBlock>' );
				expect( command.isEnabled ).to.be.false;
			} );

			it( 'should be disabled when code-block is disabled', () => {
				setData( model, '<codeBlock>[]</codeBlock>' );

				editor.commands.get( 'codeBlock' ).forceDisabled();
				expect( command.isEnabled ).to.be.false;
			} );
		} );

		describe( 'LanguageSelector', () => {
			let editor, selector;

			beforeEach( () => {
				return createTestEditor().then( ( { editor: createdEditor } ) => {
					editor = createdEditor;
					selector = new LanguageSelector( editor );
				} );
			} );

			afterEach( () => {
				selector.destroy();
				editor.destroy();
			} );

			it( 'should define #buttonView', () => {
				expect( selector.buttonView ).to.be.an.instanceOf( LanguageSelectorButtonView );
			} );

			it( 'should change label and keystroke into #buttonView', () => {
				selector.label = 'Test Label';
				selector.keystroke = 'Ctrl+T';

				expect( selector.buttonView.label ).to.equals( 'Test Label' );
				expect( selector.buttonView.keystroke ).to.equals( 'Ctrl+T' );
			} );

			it( 'should fire "language"', done => {
				selector.once( 'language', ( evt, language ) => {
					expect( language ).to.equals( 'JavaScript' );
					done();
				} );

				selector.buttonView.fire( 'language', 'JavaScript' );
			} );

			it( 'should insert the button into the target', () => {
				let pre;

				editor.editing.view.change( writer => {
					const root = editor.editing.view.document.getRoot();
					pre = writer.createContainerElement( 'pre' );
					writer.insert( writer.createPositionAt( root, 0 ), pre );

					selector.insertInto( pre, writer );
				} );

				const buttonViewElement = pre.getChild( 0 );

				expect( buttonViewElement ).to.be.an.instanceOf( UIElement );
				expect( buttonViewElement.render() ).to.equals( selector.buttonView.element );
			} );

			it( 'should execute the button', () => {
				const stub = sinon.stub( selector.buttonView, 'fire' );
				selector.execute();

				expect( stub.callCount ).to.equals( 1 );
				expect( stub.alwaysCalledWith( 'execute' ) ).to.be.true;
			} );

			it( 'should destroy the button', () => {
				const spy = sinon.spy( selector.buttonView, 'destroy' );
				selector.destroy();

				expect( spy.callCount ).to.equals( 1 );
			} );
		} );

		describe( 'LanguageSelectorButtonView', () => {
			let editor, view;

			beforeEach( () => {
				return createTestEditor().then( ( { editor: createdEditor } ) => {
					editor = createdEditor;
					view = new LanguageSelectorButtonView( editor );
					view.render();
					document.body.appendChild( view.element );
				} );
			} );

			afterEach( () => {
				view.element.remove();
				view.destroy();
				editor.destroy();
			} );

			it( 'should extend DropdownButtonView', () => {
				expect( view ).to.be.an.instanceOf( DropdownButtonView );
			} );

			it( 'should define #editor', () => {
				expect( view.editor ).to.equals( editor );
			} );

			it( 'should be toggleable', () => {
				expect( view.isToggleable ).to.be.true;
			} );

			it( 'should have a css class', () => {
				expect( view.element.classList.contains( 'ck-codeblock-language-button' ) ).to.be.true;
			} );

			it( 'should disable contenteditable', () => {
				expect( view.element.contentEditable ).to.equals( 'false' );
			} );

			it( 'should define #balloonView', () => {
				expect( view.balloonView ).to.be.an.instanceOf( LanguageSelectorBalloonView );
			} );

			it( 'should show the balloon on click', () => {
				expect( view.balloonView.isVisible ).to.be.false;

				const spy = sinon.spy( view.balloonView, 'pin' );
				view.element.click();

				expect( spy.callCount ).to.equals( 1 );
				expect( view.balloonView.isVisible ).to.be.true;
			} );

			it( 'should hide the balloon if visible on click', () => {
				view.element.click();
				expect( view.balloonView.isVisible ).to.be.true;

				const spy = sinon.spy( view.balloonView, 'unpin' );
				editor.focus = sinon.stub();
				view.element.click();

				expect( view.balloonView.isVisible ).to.be.false;
				expect( spy.callCount ).to.equals( 1 );
				expect( editor.focus.callCount ).to.equals( 1 );
			} );

			it( 'should fire "language"', done => {
				view.once( 'language', ( evt, language ) => {
					expect( language ).to.equals( 'JavaScript' );
					done();
				} );

				view.balloonView.fire( 'language', 'JavaScript' );
			} );

			it( 'should hide the balloon on the language event', () => {
				view.element.click();
				expect( view.balloonView.isVisible ).to.be.true;

				const spy = sinon.spy( view.balloonView, 'unpin' );

				view.fire( 'language', 'JavaScript' );

				expect( view.balloonView.isVisible ).to.be.false;
				expect( spy.callCount ).to.equals( 1 );
			} );
		} );

		describe( 'LanguageSelectorBalloonView', () => {
			let editor, view;

			beforeEach( () => {
				return createTestEditor().then( ( { editor: createdEditor } ) => {
					editor = createdEditor;
					view = new LanguageSelectorBalloonView( editor );
					view.render();
				} );
			} );

			afterEach( () => {
				view.destroy();
				editor.destroy();
			} );

			it( 'should extend BalloonPanelView', () => {
				expect( view ).to.be.an.instanceOf( BalloonPanelView );
			} );

			it( 'should define #editor', () => {
				expect( view.editor ).to.equals( editor );
			} );

			it( 'should have a css class', () => {
				expect( view.element.classList.contains( 'ck-codeblock-language-balloon' ) ).to.be.true;
			} );

			it( 'should contain a search view', () => {
				expect( view.content.first ).to.be.an.instanceOf( LanguageSearchView );
			} );

			it( 'should focus in the search view on load', done => {
				view.attachTo( {
					target: document.body,
					positions: [ BalloonPanelView.defaultPositions.southEastArrowNorthEast ]
				} );

				const filterInput = view.element.querySelector( ':scope' +
					' > div.ck-filteredlist' +
					' > div.select-menu-filters' +
					' > input' );

				setTimeout( () => {
					expect( document.activeElement ).to.equals( filterInput );
					done();
				} );
			} );

			it( 'should hide on esc', () => {
				view.attachTo( {
					target: document.body,
					positions: [ BalloonPanelView.defaultPositions.southEastArrowNorthEast ]
				} );

				expect( view.isVisible ).to.be.true;

				editor.focus = sinon.stub();
				view.unpin = sinon.spy();

				const evt = new KeyboardEvent( 'keydown', { keyCode: 27 } );
				view.element.dispatchEvent( evt );

				expect( view.unpin.callCount ).to.equals( 1 );
				expect( editor.focus.callCount ).to.equals( 1 );
			} );

			it( 'should hide on click outside', () => {
				view.attachTo( {
					target: document.body,
					positions: [ BalloonPanelView.defaultPositions.southEastArrowNorthEast ]
				} );

				expect( view.isVisible ).to.be.true;

				editor.focus = sinon.stub();
				view.unpin = sinon.spy();

				{
					const evt = new Event( 'mousedown', { bubbles: true } );
					view.element.dispatchEvent( evt );

					expect( view.unpin.callCount ).to.equals( 0 );
					expect( editor.focus.callCount ).to.equals( 0 );
				}

				{
					const evt = new Event( 'mousedown', { bubbles: true } );
					document.body.dispatchEvent( evt );

					expect( view.unpin.callCount ).to.equals( 1 );
					expect( editor.focus.callCount ).to.equals( 0 );
				}
			} );

			it( 'should render on pin()', () => {
				view.destroy();

				view = new LanguageSelectorBalloonView( editor );
				expect( view.isRendered ).to.be.false;

				view.pin( {
					target: document.body,
					positions: [ BalloonPanelView.defaultPositions.southEastArrowNorthEast ]
				} );

				expect( view.isRendered ).to.be.true;
			} );

			it( 'should not call body.remove() if not rendered', () => {
				const spy = sinon.spy( editor.ui.view.body, 'remove' );
				// Rendered.
				view.destroy();
				expect( spy.callCount ).to.equals( 1 );

				view = new LanguageSelectorBalloonView( editor );
				// Not rendered.
				view.destroy();
				expect( spy.callCount ).to.equals( 1 );
			} );

			it( 'should fire "language"', done => {
				view.once( 'language', ( evt, language ) => {
					expect( language ).to.equals( 'JavaScript' );
					done();
				} );

				view.content.first.fire( 'language', 'JavaScript' );
			} );
		} );

		describe( 'LanguageSearchView', () => {
			let view, elements;

			beforeEach( () => {
				view = new LanguageSearchView( locale );
				view.render();

				elements = {
					root: view.element.querySelector( ':scope.ck-filteredlist' ),
					header: view.element.querySelector( ':scope.ck-filteredlist > div.select-menu-header' ),
					filter: view.element.querySelector( ':scope.ck-filteredlist > div.select-menu-filters' ),
					list: view.element.querySelector( ':scope.ck-filteredlist > div.select-menu-list' ),
					footer: view.element.querySelector( ':scope.ck-filteredlist > div.select-menu-footer' )
				};
			} );

			afterEach( () => {
				view.destroy();
			} );

			it( 'should extend FilteredListView', () => {
				expect( view ).to.be.an.instanceOf( FilteredListView );
			} );

			it( 'should set the title', () => {
				expect( elements.header.querySelector( ':scope > span.select-menu-title' ).textContent )
					.to.equals( 'Select a language' );
			} );

			it( 'should set the keystroke', () => {
				expect( elements.header.querySelector( ':scope > code' ).textContent ).to.equals( 'ctrl+shift l' );
			} );

			it( 'should set the filter placeholder', () => {
				expect( elements.filter.querySelector( ':scope > input' ).placeholder ).to.equals( 'Filter languages...' );
			} );

			it( 'should fire "language" on item selection', done => {
				view.once( 'language', ( evt, language ) => {
					expect( language ).to.equals( 'JavaScript' );
					done();
				} );

				view.filterInputView.element.value = 'js';
				view.filterInputView.fire( 'input' );

				setTimeout( () => {
					const list = view.element.querySelector( ':scope.ck-filteredlist > div.select-menu-list' );
					const item = list.querySelector( ':scope > ul > li > button' );
					item.click();
				} );
			} );

			describe( 'query', () => {
				it( 'should have a default with five items', () => {
					const results = view.query( '' );

					expect( results ).to.be.an( 'array' ).with.lengthOf( 5 );
					expect( elements.footer.textContent ).to.match( /^\.\.\. \d+ more languages available$/ );
				} );

				it( 'should prioritize complete name match', () => {
					const results = view.query( 'java' );

					expect( results ).to.be.an( 'array' ).not.empty;
					expect( results[ 0 ].label ).to.equals( 'Java' );
				} );

				it( 'should prioritize complete alias match', () => {
					const results = view.query( 'js' );

					expect( results ).to.be.an( 'array' ).not.empty;
					expect( results[ 0 ].label ).to.equals( 'JavaScript' );
				} );

				it( 'should set footer (no match)', () => {
					const results = view.query( 'not-a-language' );

					expect( results ).to.be.an( 'array' ).empty;
					expect( elements.footer.textContent ).to.equals( 'No languages found' );
				} );

				it( 'should set footer (excess)', () => {
					const results = view.query( 'a' );

					expect( results ).to.be.an( 'array' ).with.lengthOf( 5 );
					expect( elements.footer.textContent ).to.match( /^\.\.\. \d+ more languages found$/ );
				} );

				it( 'should set footer (less than 5)', () => {
					const results = view.query( 'TypeScript' );

					expect( results ).to.be.an( 'array' ).with.lengthOf( 1 );
					expect( elements.footer.style.display ).to.equals( 'none' );
				} );

				it( 'should set footer (exactly 6)', () => {
					LanguageSearchView.searchSource = [
						'>test1|Test 1',
						'>test2|Test 2',
						'>test3|Test 3',
						'>test4|Test 4',
						'>test5|Test 5',
						'>test6|Test 6'
					].join( '\n' );

					const results = view.query( 'test' );

					expect( results ).to.be.an( 'array' ).with.lengthOf( 5 );
					expect( elements.footer.textContent ).to.equals( '... 1 more language found' );
				} );
			} );
		} );
	} );
} );
