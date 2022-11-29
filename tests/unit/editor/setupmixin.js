/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../../../src/app/editor/editor';
import { GitHubPage } from '../../_util/githubpage';
import { createElementFromHtml } from '../../../src/app/modules/util';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';
import EventInfo from '@ckeditor/ckeditor5-utils/src/eventinfo';
import DomEventData from '@ckeditor/ckeditor5-engine/src/view/observer/domeventdata';
import CKEditorConfig from '../../../src/app/editor/ckeditorconfig';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import QuoteSelection from '../../../src/app/plugins/quoteselection';
import PendingActions from '@ckeditor/ckeditor5-core/src/pendingactions';

describe( 'Editor', () => {
	describe( 'SetupMixin', () => {
		describe( '_setupSessionResume', () => {
			it( 'should setup session resume', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				const stub = sinon.stub( editor, '_setupSessionResume' );

				return editor.create()
					.then( () => {
						expect( stub.callCount ).to.equals( 1 );
					} );
			} );

			it( 'should save session on setData()', () => {
				const root = GitHubPage.appendRoot();
				const editor = new Editor( root );

				return editor.create()
					.then( () => {
						expect( sessionStorage.getItem( editor.sessionKey ) ).to.be.null;
						editor.setData( 'new data' );
						expect( sessionStorage.getItem( editor.sessionKey ) ).to.be.a( 'string' );
					} );
			} );

			it( 'should save session on mode change', () => {
				const root = GitHubPage.appendRoot();
				const editor = new Editor( root );

				return editor.create()
					.then( () => {
						expect( sessionStorage.getItem( editor.sessionKey ) ).to.be.null;

						editor.setMode( Editor.modes.MARKDOWN );
						expect( JSON.parse( sessionStorage.getItem( editor.sessionKey ) ) ).to.eql( {
							mode: Editor.modes.MARKDOWN
						} );

						editor.setMode( Editor.modes.RTE );
						expect( JSON.parse( sessionStorage.getItem( editor.sessionKey ) ).mode ).to.equals(
							Editor.modes.RTE );
					} );
			} );

			it( 'should register listener just once', () => {
				const root = GitHubPage.appendRoot();
				const editor = new Editor( root );

				return editor.create()
					.then( () => {
						const spy = sinon.spy( editor.ckeditor.model, 'on' );

						editor.fire( 'mode' );
						editor.fire( 'mode' );

						expect( spy.withArgs( 'data' ).callCount ).to.equals( 0 );
					} );
			} );
		} );

		describe( '_setupFocus', () => {
			it( 'should focus on write tab click', done => {
				const editor = new Editor( GitHubPage.appendRoot() );

				editor.create()
					.then( () => {
						sinon.stub( editor.ckeditor, 'focus' ).callsFake( () => done() );
						editor.dom.tabs.write.dispatchEvent( new Event( 'click' ) );
					} );
			} );

			it( 'should work with no write tab available', () => {
				const root = GitHubPage.appendRoot();
				root.querySelector( '.tabnav-tabs' ).remove();

				sinon.stub( Editor.prototype, 'getDom' ).callsFake( function( root ) {
					const dom = Editor.prototype.getDom.wrappedMethod.call( this, root );
					delete dom.tabs;
					return dom;
				} );

				const editor = new Editor( root );

				return editor.create()
					.then( () => {
						expect( editor.dom.tabs ).to.be.undefined;

						const target = editor.dom.root.querySelector( '.github-writer-panel-rte' );

						editor.ckeditor.ui.focusTracker.fire( 'change:isFocused', 'isFocused', true );
						expect( target.classList.contains( 'focus' ) ).to.be.true;
					} );
			} );

			it( 'should do nothing on write tab click out of rte mode', done => {
				const editor = new Editor( GitHubPage.appendRoot() );

				editor.create()
					.then( () => {
						sinon.stub( editor.ckeditor, 'focus' ).callsFake( () => expect.fail() );

						editor.setMode( Editor.modes.MARKDOWN );
						editor.dom.tabs.write.dispatchEvent( new Event( 'click' ) );

						setTimeout( () => done(), 1 );
					} );
			} );

			it( 'should set focus styles', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( () => {
						const target = editor.dom.root.querySelector( '.github-writer-panel-rte' );

						editor.ckeditor.ui.focusTracker.fire( 'change:isFocused', 'isFocused', true );
						expect( target.classList.contains( 'focus' ) ).to.be.true;

						editor.ckeditor.ui.focusTracker.fire( 'change:isFocused', 'isFocused', false );
						expect( target.classList.contains( 'focus' ) ).to.be.false;
					} );
			} );
		} );

		describe( '_setupEmptyCheck', () => {
			it( 'should call _setSubmitStatus on change', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( () => {
						const spy = sinon.spy( editor, '_setSubmitStatus' );

						editor.ckeditor.fire( 'change:isEmpty', 'isEmpty', true );
						expect( spy.callCount ).to.equals( 1 );

						editor.ckeditor.fire( 'change:isEmpty', 'isEmpty', false );
						expect( spy.callCount ).to.equals( 2 );
					} );
			} );

			it( 'should set the submit alternative button label (issue)', () => {
				GitHubPage.setPageName( 'repo_issues' );

				const editor = new Editor( GitHubPage.appendRoot( { submitAlternative: true } ) );

				const actionTextEl = createElementFromHtml( '<span class="js-form-action-text">Test</span>' );
				editor.dom.getSubmitAlternativeBtn().append( actionTextEl );

				return editor.create()
					.then( () => {
						editor.ckeditor.setData( '' );
						expect( actionTextEl.textContent ).to.equals( 'Close issue' );

						editor.ckeditor.setData( 'test' );
						expect( actionTextEl.textContent ).to.equals( 'Close and comment' );
					} );
			} );

			it( 'should set the submit alternative button label (pr)', () => {
				GitHubPage.setPageName( 'repo_pulls' );

				const editor = new Editor( GitHubPage.appendRoot( { submitAlternative: true } ) );

				const actionTextEl = createElementFromHtml( '<span class="js-form-action-text">Test</span>' );
				editor.dom.getSubmitAlternativeBtn().append( actionTextEl );

				return editor.create()
					.then( () => {
						editor.ckeditor.setData( '' );
						expect( actionTextEl.textContent ).to.equals( 'Close pull request' );

						editor.ckeditor.setData( 'test' );
						expect( actionTextEl.textContent ).to.equals( 'Close and comment' );
					} );
			} );

			it( 'should not touch the submit alternative button if not issue or pr', () => {
				GitHubPage.setPageName( 'repo_test' );

				const editor = new Editor( GitHubPage.appendRoot( { submitAlternative: true } ) );

				const actionTextEl = createElementFromHtml( '<span class="js-form-action-text">Test</span>' );
				editor.dom.getSubmitAlternativeBtn().append( actionTextEl );

				return editor.create()
					.then( () => {
						editor.ckeditor.fire( 'change:isEmpty', 'isEmpty', true );
						expect( actionTextEl.textContent ).to.equals( 'Test' );

						editor.ckeditor.fire( 'change:isEmpty', 'isEmpty', false );
						expect( actionTextEl.textContent ).to.equals( 'Test' );
					} );
			} );
		} );

		describe( '_setupForm', () => {
			it( 'should reset the editor data on form reset', done => {
				const editor = new Editor( GitHubPage.appendRoot() );
				editor.dom.root.querySelector( 'textarea' ).defaultValue = 'Test';

				editor.create()
					.then( () => {
						editor.setData( 'Changed data' );
						expect( editor.getData() ).to.equals( 'Changed data' );

						editor.dom.textarea.form.dispatchEvent( new Event( 'reset' ) );

						setTimeout( () => {
							expect( editor.getData() ).to.equals( 'Test' );
							done();
						}, 1 );
					} );
			} );

			it( 'should lock the form on data change', () => {
				const editor = new Editor( GitHubPage.appendRoot( { text: 'test' } ) );
				const textarea = editor.dom.root.querySelector( 'textarea' );

				editor.create()
					.then( () => {
						expect( textarea.validity.customError ).to.be.false;
						editor.setData( 'Changed data' );
						expect( textarea.validity.customError ).to.be.true;
					} );
			} );

			it( 'should unlock the form on sync', () => {
				const editor = new Editor( GitHubPage.appendRoot( { text: 'test' } ) );
				const textarea = editor.dom.root.querySelector( 'textarea' );

				return editor.create()
					.then( () => {
						expect( textarea.validity.customError ).to.be.false;
						editor.setData( 'Changed data' );
						expect( textarea.validity.customError ).to.be.true;

						editor.syncData();

						expect( textarea.validity.customError ).to.be.false;
					} );
			} );

			it( 'should unlock the form during submit', () => {
				const editor = new Editor( GitHubPage.appendRoot( { text: 'test' } ) );
				const textarea = editor.dom.root.querySelector( 'textarea' );

				return editor.create()
					.then( () => {
						expect( textarea.validity.customError ).to.be.false;
						editor.setData( 'Changed data' );
						expect( textarea.validity.customError ).to.be.true;

						editor.dom.getSubmitBtn().dispatchEvent( new Event( 'click' ) );

						expect( textarea.validity.customError ).to.be.false;
					} );
			} );

			it( 'should lock/unlock the form when switching modes', () => {
				const editor = new Editor( GitHubPage.appendRoot( { text: 'test' } ) );
				const textarea = editor.dom.root.querySelector( 'textarea' );

				return editor.create()
					.then( () => {
						editor.setData( 'Changed data' );
						expect( textarea.validity.customError ).to.be.true;

						editor.setMode( Editor.modes.MARKDOWN );
						expect( textarea.validity.customError ).to.be.false;

						editor.setMode( Editor.modes.RTE );
						expect( textarea.validity.customError ).to.be.true;
					} );
			} );

			it( 'should clean the textarea on form unlock', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const textarea = editor.dom.root.querySelector( 'textarea' );
				textarea.required = false;

				return editor.create()
					.then( () => {
						editor.setData( 'Changed data' );
						expect( textarea.validity.customError ).to.be.true;
						expect( textarea.required ).to.be.true;

						editor.syncData();

						expect( textarea.validity.customError ).to.be.false;
						expect( textarea.required ).to.be.false;

						editor.setData( 'Changed data again' );
						expect( textarea.validity.customError ).to.be.true;
						expect( textarea.required ).to.be.true;

						editor.syncData();

						expect( textarea.validity.customError ).to.be.false;
						expect( textarea.required ).to.be.false;
					} );
			} );

			it( 'should remove "formnovalidate" from buttons on form lock', () => {
				const editor = new Editor( GitHubPage.appendRoot( { text: 'test', submitAlternative: true } ) );
				const button = editor.dom.root.querySelector( '.js-quick-submit-alternative' );

				return editor.create()
					.then( () => {
						expect( button.hasAttribute( 'formnovalidate' ) ).to.be.true;
						editor.setData( 'Changed data' );
						expect( button.hasAttribute( 'formnovalidate' ) ).to.be.false;
					} );
			} );

			it( 'should restore "formnovalidate" from buttons on form unlock', () => {
				const editor = new Editor( GitHubPage.appendRoot( { text: 'test', submitAlternative: true } ) );
				const button = editor.dom.root.querySelector( '.js-quick-submit-alternative' );

				return editor.create()
					.then( () => {
						expect( button.hasAttribute( 'formnovalidate' ) ).to.be.true;
						editor.setData( 'Changed data' );
						expect( button.hasAttribute( 'formnovalidate' ) ).to.be.false;

						editor.dom.getSubmitBtn().dispatchEvent( new Event( 'click' ) );

						expect( button.hasAttribute( 'formnovalidate' ) ).to.be.true;
					} );
			} );

			it( 'should unlock the form if user aborts mode switch', () => {
				const editor = new Editor( GitHubPage.appendRoot( { text: 'Test <x>' } ) );
				const textarea = editor.dom.root.querySelector( 'textarea' );

				return editor.create().then( () => {
					expect( editor.getMode() ).to.equals( Editor.modes.MARKDOWN );

					sinon.stub( window, 'confirm' ).returns( false );

					editor.setMode( Editor.modes.RTE );

					expect( window.confirm.callCount, 'callCount' ).to.equals( 1 );
					expect( editor.getMode() ).to.equals( Editor.modes.MARKDOWN );
					expect( textarea.validity.customError ).to.be.false;
				} );
			} );

			describe( 'submit buttons click', () => {
				it( 'should sync editors on submit.click', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					return editor.create()
						.then( () => {
							const spy = sinon.spy( editor, 'syncData' );
							editor.dom.getSubmitBtn().dispatchEvent( new Event( 'click' ) );

							expect( spy.callCount ).to.equals( 1 );
						} );
				} );

				it( 'should sync editors on submitAlternative.click', () => {
					const editor = new Editor( GitHubPage.appendRoot( { submitAlternative: true } ) );

					return editor.create()
						.then( () => {
							const spy = sinon.spy( editor, 'syncData' );
							editor.dom.getSubmitAlternativeBtn().dispatchEvent( new Event( 'click' ) );

							expect( spy.callCount ).to.equals( 1 );
						} );
				} );

				it( 'should do nothing on submit.click if not RTE mode', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					return editor.create()
						.then( () => {
							editor.setMode( Editor.modes.MARKDOWN );

							const spy = sinon.spy( editor, 'syncData' );
							editor.dom.getSubmitBtn().dispatchEvent( new Event( 'click' ) );

							expect( spy.callCount ).to.equals( 0 );
						} );
				} );

				it( 'should do nothing on submit.click outside the form', () => {
					const editor = new Editor( GitHubPage.appendRoot() );
					const button = GitHubPage.appendElementHtml( '<button type="submit">Outside</button>' );

					return editor.create()
						.then( () => {
							const syncSpy = sinon.spy( editor, 'syncData' );
							const consoleSpy = sinon.spy( console, 'error' );

							button.dispatchEvent( new Event( 'click' ) );

							expect( syncSpy.callCount ).to.equals( 0 );
							expect( consoleSpy.callCount ).to.equals( 0 );
						} );
				} );

				it( 'should console.log sync errors', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					return editor.create()
						.then( () => {
							const error = new Error( 'test' );
							sinon.stub( editor, 'syncData' ).throws( error );

							const spy = sinon.stub( console, 'error' );

							expect( () => {
								editor.dom.getSubmitBtn().dispatchEvent( new Event( 'click' ) );
							} ).to.not.throw();

							expect( spy.callCount ).to.equals( 1 );
							expect( spy.calledWithExactly( error ) ).to.be.true;
						} );
				} );

				it( 'should show error message on sync error', () => {
					const root = GitHubPage.appendRoot();
					const editor = new Editor( root );
					const errorContainer = root.querySelector( '.js-comment-form-error' );
					sinon.stub( console, 'error' );

					expect( errorContainer.hidden ).to.be.true;

					return editor.create()
						.then( () => {
							sinon.stub( editor, 'syncData' ).throws();

							expect( () => {
								editor.dom.getSubmitBtn().dispatchEvent( new Event( 'click' ) );
							} ).to.not.throw();

							expect( errorContainer.hidden ).to.be.false;
						} );
				} );

				it( 'should not fail on missing error container', () => {
					const root = GitHubPage.appendRoot();
					const editor = new Editor( root );
					root.querySelector( '.js-comment-form-error' ).remove();

					return editor.create()
						.then( () => {
							sinon.stub( editor, 'syncData' ).throws();

							const stub = sinon.stub( console, 'error' );

							expect( () => {
								editor.dom.getSubmitBtn().dispatchEvent( new Event( 'click' ) );
							} ).to.not.throw();

							expect( stub.callCount ).to.equals( 1 );
						} );
				} );
			} );
		} );

		describe( '_setupKeystrokes', () => {
			function fireKeyDownEvent( editor, keyInfo ) {
				const editingView = editor.ckeditor.editing.view;
				const eventInfo = new EventInfo( editingView.document, 'keydown' );
				const eventData = new DomEventData( editingView.document, {
					target: document.body,
					preventDefault: () => {
					},
					stopPropagation: () => {
					}
				}, keyInfo );

				editingView.document.fire( eventInfo, eventData );
			}

			// Submit shortcuts.
			{
				it( 'should click the submit button on cmd/ctrl+enter', () => {
					const editor = new Editor( GitHubPage.appendRoot( { submitAlternative: true } ) );

					return editor.create()
						.then( () => {
							const stub = sinon.stub( editor.dom.getSubmitBtn(), 'click' );

							fireKeyDownEvent( editor, {
								keyCode: keyCodes.enter,
								ctrlKey: true
							} );

							expect( stub.callCount ).to.equals( 1 );
						} );
				} );

				it( 'should click the submit alternative button on shift+cmd/ctrl+enter', () => {
					const editor = new Editor( GitHubPage.appendRoot( { submitAlternative: true } ) );

					return editor.create()
						.then( () => {
							const stub = sinon.stub( editor.dom.getSubmitAlternativeBtn(), 'click' );

							expect( stub.callCount ).to.equals( 0 );

							fireKeyDownEvent( editor, {
								keyCode: keyCodes.enter,
								ctrlKey: true,
								shiftKey: true
							} );

							expect( stub.callCount ).to.equals( 1 );
						} );
				} );

				[
					{
						name: 'enter',
						keyCode: keyCodes.enter
					},
					{
						name: 'shift+enter',
						keyCode: keyCodes.enter,
						shiftKey: true
					},
					{
						name: 'non-enter',
						keyCode: keyCodes.space,
						ctrlKey: true
					},
					{
						name: 'alt+cmd/ctrl+enter',
						keyCode: keyCodes.enter,
						ctrlKey: true,
						altKey: true
					},
					{
						name: 'alt+shift+cmd/ctrl+enter',
						keyCode: keyCodes.enter,
						ctrlKey: true,
						altKey: true
					}
				].forEach( keystroke => {
					it( `should do nothing on enter (${ keystroke.name })`, () => {
						const editor = new Editor( GitHubPage.appendRoot( { submitAlternative: true } ) );

						return editor.create()
							.then( () => {
								const stub = sinon.stub( editor.dom.getSubmitBtn(), 'click' );
								const stubAlternative = sinon.stub( editor.dom.getSubmitAlternativeBtn(), 'click' );

								expect( stub.callCount ).to.equals( 0 );
								expect( stubAlternative.callCount ).to.equals( 0 );

								fireKeyDownEvent( editor, keystroke );

								expect( stub.callCount ).to.equals( 0 );
								expect( stubAlternative.callCount ).to.equals( 0 );
							} );
					} );
				} );
			}

			// Block switch to preview.
			{
				it( 'should block cmd/ctrl+shit+p', () => {
					const editor = new Editor( GitHubPage.appendRoot( { submitAlternative: true } ) );

					return editor.create()
						.then( () => {
							const domEvent = new Event( 'keydown' );
							const spy = sinon.spy( domEvent, 'preventDefault' );

							const viewDocument = editor.ckeditor.editing.view.document;
							viewDocument.fire( 'keydown', {
								keyCode: 80,
								ctrlKey: true,
								shiftKey: true,
								domEvent
							} );

							expect( spy.callCount ).to.equals( 1 );
						} );
				} );
			}
		} );

		describe( '_setupPendingActions', () => {
			it( 'should call _setSubmitStatus on change', () => {
				// Stubbed in beforeEach.
				CKEditorConfig.get.returns( { plugins: [ Paragraph, QuoteSelection, PendingActions ] } );

				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( () => {
						const spy = sinon.spy( editor, '_setSubmitStatus' );

						const pendingActions = editor.ckeditor.plugins.get( 'PendingActions' );

						pendingActions.fire( 'change:hasAny', 'hasAny', true );
						expect( spy.callCount ).to.equals( 1 );

						pendingActions.fire( 'change:hasAny', 'hasAny', false );
						expect( spy.callCount ).to.equals( 2 );
					} );
			} );

			it( 'should do nothing without the PendingActions plugin', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( editor => {
						// Nothing to check. Just that the creation happened without throwing errors.
						expect( editor ).to.be.an.instanceOf( Editor );
					} );
			} );

			it( 'should call "change:addAction" action', () => {
				const editor = new Editor( GitHubPage.appendRoot( ) );

				return editor.create()
					.then( () => {
						const event = new Event( 'submit' );
						const spy = sinon.spy( event, 'change:addAction' );

						const pendingActions = this.ckeditor.plugins.get( 'PendingActions' );
						pendingActions.fire( 'change:addAction', 'submit' );

						expect( spy.callCount ).to.equals( 1 );
					} );
			} );
		} );
	} );
} );
