/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../../src/app/editor';
import RteEditor from '../../src/app/editors/rteeditor';
import WikiRteEditor from '../../src/app/editors/wikirteeditor';
import MarkdownEditor from '../../src/app/editors/markdowneditor';
import WikiMarkdownEditor from '../../src/app/editors/wikimarkdowneditor';

import RteEditorConfig from '../../src/app/editors/rteeditorconfig';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';

import { DomManipulator, PageIncompatibilityError } from '../../src/app/util';

import { GitHubPage } from '../_util/githubpage';

describe( 'Editor', () => {
	beforeEach( () => {
		// Mute RteEditor code that is out of the scope of the tests in this file.
		sinon.stub( RteEditorConfig, 'get' ).returns( { plugins: [ Paragraph ] } );
		sinon.stub( RteEditor, 'toolbarItemsPostfix' );

		// Mute dev logging.
		sinon.stub( console, 'log' ).callsFake( ( ...args ) => {
			if ( !( args[ 1 ] instanceof Editor ) ) {
				console.log.wrappedMethod.apply( console, args );
			}
		} );

		// Mute click on elements as the write tab click messing up with tests
		sinon.stub( HTMLElement.prototype, 'click' );
	} );

	describe( 'constructor()', () => {
		it( 'should generate id', () => {
			const editor1 = new Editor( GitHubPage.appendRoot() );
			const editor2 = new Editor( GitHubPage.appendRoot() );

			expect( editor1 ).to.have.property( 'id' ).be.a( 'number' ).greaterThan( 0 );
			expect( editor2.id ).to.be.greaterThan( editor1.id );
		} );

		it( 'should create a DomManipulator', () => {
			const editor = new Editor( GitHubPage.appendRoot() );

			expect( editor ).to.have.property( 'domManipulator' ).instanceOf( DomManipulator );
		} );

		it( 'should save dom references', () => {
			const root = GitHubPage.appendRoot();
			const editor = new Editor( root );

			expect( editor ).to.have.property( 'dom' );
			expect( editor.dom.root ).to.equals( root );
		} );

		it( 'should throw error on invalid dom', () => {
			const root = GitHubPage.appendRoot();
			root.querySelector( '.write-tab' ).remove();

			expect( () => new Editor( root ) ).to.throw( PageIncompatibilityError );
		} );

		it( 'should use the right classes for inner editors (comments)', () => {
			GitHubPage.reset();
			GitHubPage.setPageName( 'repo_issue' );
			GitHubPage.setApp();

			const editor = new Editor( GitHubPage.appendRoot() );

			expect( editor.markdownEditor ).to.be.an.instanceOf( MarkdownEditor );
			expect( editor.rteEditor ).to.be.an.instanceOf( RteEditor );
		} );

		it( 'should use the right classes for inner editors (wiki)', () => {
			GitHubPage.reset();
			GitHubPage.setPageName( 'repo_wiki' );
			GitHubPage.setApp();

			const editor = new Editor( GitHubPage.appendRoot( { type: 'wiki' } ) );

			expect( editor.markdownEditor ).to.be.an.instanceOf( WikiMarkdownEditor );
			expect( editor.rteEditor ).to.be.an.instanceOf( WikiRteEditor );

			expect( editor.markdownEditor.dom.root ).to.equals( editor.dom.root );
			expect( editor.rteEditor.githubEditor ).to.equals( editor );
		} );

		it( 'should root to have wiki class when in wiki', () => {
			GitHubPage.reset();
			GitHubPage.setPageName( 'repo_wiki' );
			GitHubPage.setApp();

			const editor = new Editor( GitHubPage.appendRoot( { type: 'wiki' } ) );

			expect( editor.dom.root.classList.contains( 'github-rte-type-wiki' ) ).to.be.true;
		} );

		it( 'should root to not have wiki class when not in wiki', () => {
			const editor = new Editor( GitHubPage.appendRoot( { type: 'wiki' } ) );

			expect( editor.dom.root.classList.contains( 'github-rte-type-wiki' ) ).to.be.false;
		} );
	} );

	describe( 'getMode()', () => {
		it( 'should be unknown on start', () => {
			const editor = new Editor( GitHubPage.appendRoot() );

			expect( editor.getMode() ).to.equals( Editor.modes.UNKNOWN );
		} );

		[ Editor.modes.RTE, Editor.modes.MARKDOWN, Editor.modes.DESTROYED ].forEach( mode => {
			it( `should get the mode (${ mode })`, () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				editor.setMode( mode, { noCheck: true, noSynch: true } );
				expect( editor.getMode() ).to.equals( mode );
			} );
		} );
	} );

	describe( 'setMode()', () => {
		beforeEach( () => {
			sinon.stub( window, 'confirm' ).returns( true );
		} );

		it( 'should fire the "mode" event', () => {
			const editor = new Editor( GitHubPage.appendRoot() );

			editor.on( 'mode', () => {
				expect( editor.getMode() ).to.equals( Editor.modes.DESTROYED );
			} );

			editor.setMode( Editor.modes.DESTROYED );
		} );

		it( 'should not fire the "mode" event if no mode change', () => {
			const editor = new Editor( GitHubPage.appendRoot() );

			editor.setMode( Editor.modes.DESTROYED );

			editor.on( 'mode', () => {
				expect.fail( 'the mode event was fired' );
			} );

			editor.setMode( Editor.modes.DESTROYED );
		} );

		it( 'should click the write tab', () => {
			const editor = new Editor( GitHubPage.appendRoot() );

			// Stubbed in beforeEach.
			const stub = editor.dom.tabs.write.click;

			// First setMode should not call it.
			editor.setMode( Editor.modes.MARKDOWN );
			expect( stub.callCount ).to.equals( 0 );

			editor.setMode( Editor.modes.RTE );
			expect( stub.callCount ).to.equals( 1 );

			editor.setMode( Editor.modes.MARKDOWN );
			expect( stub.callCount ).to.equals( 2 );

			// Expect to be not called on destroy.
			editor.setMode( Editor.modes.DESTROYED );
			expect( stub.callCount ).to.equals( 2 );
		} );

		it( 'should set root classes', () => {
			const editor = new Editor( GitHubPage.appendRoot() );

			editor.setMode( Editor.modes.MARKDOWN );
			expect( editor.dom.root.classList.contains( 'github-rte-mode-rte' ), 'rte' ).to.be.false;
			expect( editor.dom.root.classList.contains( 'github-rte-mode-markdown' ), 'markdown' ).to.be.true;

			editor.setMode( Editor.modes.RTE );
			expect( editor.dom.root.classList.contains( 'github-rte-mode-rte' ), 'rte' ).to.be.true;
			expect( editor.dom.root.classList.contains( 'github-rte-mode-markdown' ), 'markdown' ).to.be.false;
		} );

		it( 'should noSynch and noCheck when setting to destroyed', () => {
			const editor = new Editor( GitHubPage.appendRoot() );

			sinon.stub( editor, 'syncEditors' );
			sinon.stub( editor, '_checkDataLoss' );

			editor.setMode( Editor.modes.DESTROYED );

			expect( editor.syncEditors.callCount, 'syncEditors' ).to.equals( 0 );
			expect( editor._checkDataLoss.callCount, '_checkDataLoss' ).to.equals( 0 );
		} );

		describe( 'data synch', () => {
			it( 'should synch editors by default', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				sinon.stub( editor, 'syncEditors' );

				editor.setMode( Editor.modes.RTE );

				expect( editor.syncEditors.callCount, 'callCount' ).to.equals( 1 );
			} );

			it( 'should synch editors with noSynch=false', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				sinon.stub( editor, 'syncEditors' );

				editor.setMode( Editor.modes.RTE, { noSynch: false } );

				expect( editor.syncEditors.callCount, 'callCount' ).to.equals( 1 );
			} );

			it( 'should not synch editors with noSynch=true', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				sinon.stub( editor, 'syncEditors' );

				editor.setMode( Editor.modes.RTE, { noSynch: true } );

				expect( editor.syncEditors.callCount, 'callCount' ).to.equals( 0 );
			} );
		} );

		describe( 'data check', () => {
			it( 'should check by default', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				editor.setMode( Editor.modes.MARKDOWN );

				sinon.stub( editor, '_checkDataLoss' ).returns( false );

				editor.setMode( Editor.modes.RTE );

				expect( editor._checkDataLoss.callCount, 'callCount' ).to.equals( 1 );
			} );

			it( 'should check with noCheck=false', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				editor.setMode( Editor.modes.MARKDOWN );

				sinon.stub( editor, '_checkDataLoss' ).returns( false );

				editor.setMode( Editor.modes.RTE, { noCheck: false } );

				expect( editor._checkDataLoss.callCount, 'callCount' ).to.equals( 1 );
			} );

			it( 'should not check with noCheck=true', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				editor.setMode( Editor.modes.MARKDOWN );

				sinon.stub( editor, '_checkDataLoss' ).returns( false );

				editor.setMode( Editor.modes.RTE, { noCheck: true } );

				expect( editor._checkDataLoss.callCount, 'callCount' ).to.equals( 0 );
			} );

			it( 'should ask user confirmation if data loss', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				editor.setMode( Editor.modes.MARKDOWN );

				sinon.stub( editor, '_checkDataLoss' ).returns( true );

				editor.setMode( Editor.modes.RTE );

				expect( window.confirm.callCount, 'callCount' ).to.equals( 1 );
			} );

			it( 'should ask user confirmation if data loss and abort if not confirmed', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				editor.setMode( Editor.modes.MARKDOWN );

				sinon.stub( editor, '_checkDataLoss' ).returns( true );
				window.confirm.returns( false );

				editor.setMode( Editor.modes.RTE );

				expect( window.confirm.callCount, 'callCount' ).to.equals( 1 );
				expect( editor.getMode() ).to.equals( Editor.modes.MARKDOWN );
			} );
		} );
	} );

	describe( 'create()', () => {
		it( 'should return a promise that resolves to an editor', () => {
			const root = GitHubPage.appendRoot();
			const editor = new Editor( root );

			const promise = editor.create();

			expect( promise ).to.be.an.instanceOf( Promise );

			return promise.then( editor => {
				expect( editor ).to.be.an.instanceOf( Editor );
			} );
		} );

		it( 'should set the initial data', () => {
			const root = GitHubPage.appendRoot( { text: 'test' } );
			const editor = new Editor( root );

			return editor.create()
				.then( () => {
					expect( editor.rteEditor.getData() ).to.equals( 'test' );
				} );
		} );

		it( 'should set the initial mode', () => {
			const root = GitHubPage.appendRoot();
			const editor = new Editor( root );

			const spy = sinon.spy( editor, 'setMode' );

			return editor.create()
				.then( () => {
					expect( spy.callCount ).to.equals( 1 );
					expect( spy.firstCall.args[ 0 ] ).to.equals( Editor.modes.RTE );
				} );
		} );

		it( 'should set the initial mode to markdown if data loss detected', () => {
			const root = GitHubPage.appendRoot( { text: '<not-compatible>Test</not-compatible>' } );
			const editor = new Editor( root );

			const spy = sinon.spy( editor, 'setMode' );

			return editor.create()
				.then( () => {
					expect( spy.callCount ).to.equals( 1 );
					expect( spy.firstCall.args[ 0 ] ).to.equals( Editor.modes.MARKDOWN );
				} );
		} );

		describe( 'session resume', () => {
			it( 'should setup session resume', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				const stub = sinon.stub( editor, '_setupSessionResume' );

				return editor.create()
					.then( () => {
						expect( stub.callCount ).to.equals( 1 );
					} );
			} );

			// Session save.
			{
				it( 'should save session on window#pagehide', () => {
					const root = GitHubPage.appendRoot( { text: 'initial data' } );
					const textareaId = root.querySelector( 'textarea' ).id;
					const editor = new Editor( root );

					return editor.create()
						.then( () => {
							editor.rteEditor.setData( 'new data' );

							window.dispatchEvent( new Event( 'pagehide' ) );

							expect( sessionStorage.getItem( editor.sessionKey ) ).to.be.a( 'string' );

							return editor.destroy()
								.then( () => {
									root.remove();

									const newRoot = GitHubPage.appendRoot( { text: 'initial data' } );
									newRoot.querySelector( 'textarea' ).id = textareaId;
									const newEditor = new Editor( newRoot );

									return newEditor.create()
										.then( () => {
											expect( newEditor.rteEditor.getData() ).to.equals( 'new data' );
										} );
								} );
						} );
				} );

				it( 'should save session on pjax', () => {
					const root = GitHubPage.appendRoot( { text: 'initial data' } );
					const textareaId = root.querySelector( 'textarea' ).id;
					const editor = new Editor( root );

					return editor.create()
						.then( () => {
							editor.rteEditor.setData( 'new data with pjax' );

							document.body.dispatchEvent( new Event( 'pjax:start', { bubbles: true } ) );

							expect( sessionStorage.getItem( editor.sessionKey ) ).to.be.a( 'string' );

							return editor.destroy()
								.then( () => {
									root.remove();

									const newRoot = GitHubPage.appendRoot( { text: 'initial data' } );
									newRoot.querySelector( 'textarea' ).id = textareaId;
									const newEditor = new Editor( newRoot );

									return newEditor.create()
										.then( () => {
											expect( newEditor.rteEditor.getData() ).to.equals( 'new data with pjax' );
										} );
								} );
						} );
				} );

				it( 'should do nothing if pjax doesnt touch this editor', () => {
					const divRoot = GitHubPage.appendElementHtml( '<div></div>' );
					const divPjax = GitHubPage.appendElementHtml( '<div></div>' );

					const root = GitHubPage.appendRoot( { text: 'initial data', target: divRoot } );
					const editor = new Editor( root );

					return editor.create()
						.then( () => {
							editor.rteEditor.setData( 'new data with pjax' );

							divPjax.dispatchEvent( new Event( 'pjax:start', { bubbles: true } ) );

							expect( sessionStorage.getItem( editor.sessionKey ) ).to.be.null;
						} );
				} );
			}

			// Session resume.
			{
				it( 'should cleanup session data after using it', () => {
					const root = GitHubPage.appendRoot( { text: 'initial data' } );
					const textareaId = root.querySelector( 'textarea' ).id;
					const editor = new Editor( root );

					return editor.create()
						.then( () => {
							editor.rteEditor.setData( 'new data' );

							window.dispatchEvent( new Event( 'pagehide' ) );

							expect( sessionStorage.getItem( editor.sessionKey ) ).to.be.a( 'string' );

							return editor.destroy()
								.then( () => {
									root.remove();

									const newRoot = GitHubPage.appendRoot( { text: 'initial data' } );
									newRoot.querySelector( 'textarea' ).id = textareaId;
									const newEditor = new Editor( newRoot );

									expect( sessionStorage.getItem( editor.sessionKey ) ).to.be.a( 'string' );

									return newEditor.create()
										.then( () => {
											expect( sessionStorage.getItem( editor.sessionKey ) ).to.be.null;
										} );
								} );
						} );
				} );

				it( 'should force the initial mode (markdown)', () => {
					const root = GitHubPage.appendRoot( { text: 'initial data' } );
					const textareaId = root.querySelector( 'textarea' ).id;
					const editor = new Editor( root );

					return editor.create()
						.then( () => {
							editor.rteEditor.setData( 'new data' );
							editor.setMode( Editor.modes.MARKDOWN );

							window.dispatchEvent( new Event( 'pagehide' ) );

							return editor.destroy()
								.then( () => {
									root.remove();

									const newRoot = GitHubPage.appendRoot( { text: 'whatever new data' } );
									newRoot.querySelector( 'textarea' ).id = textareaId;
									const newEditor = new Editor( newRoot );

									return newEditor.create()
										.then( () => {
											expect( newEditor.getMode() ).to.equals( Editor.modes.MARKDOWN );
											expect( newEditor.markdownEditor.getData() ).to.equals( 'whatever new data' );
										} );
								} );
						} );
				} );
			}
		} );
	} );

	describe( 'destroy()', () => {
		it( 'should set mode', () => {
			const editor = new Editor( GitHubPage.appendRoot() );

			return editor.create()
				.then( () => {
					const spy = sinon.spy( editor, 'setMode' );

					editor.destroy();

					expect( spy.callCount ).to.equals( 1 );
					expect( spy.firstCall.args[ 0 ] ).to.equals( Editor.modes.DESTROYED );
				} );
		} );

		it( 'should do nothing on second call', () => {
			const editor = new Editor( GitHubPage.appendRoot() );

			return editor.create()
				.then( () => {
					editor.destroy();

					const spy = sinon.spy( editor, 'setMode' );

					return editor.destroy()
						.then( result => {
							expect( result ).to.be.false;
							expect( spy.callCount ).to.equals( 0 );
						} );
				} );
		} );

		it( 'should sync if rte', () => {
			const editor = new Editor( GitHubPage.appendRoot() );

			return editor.create()
				.then( () => {
					const stub = sinon.stub( editor, 'syncEditors' );

					editor.destroy();

					expect( stub.callCount ).to.equals( 1 );
				} );
		} );

		it( 'should not sync if markdown', () => {
			const editor = new Editor( GitHubPage.appendRoot() );

			return editor.create()
				.then( () => {
					editor.setMode( Editor.modes.MARKDOWN );

					const stub = sinon.stub( editor, 'syncEditors' );

					editor.destroy();

					expect( stub.callCount ).to.equals( 0 );
				} );
		} );

		it( 'should destroy the rte editor', () => {
			const editor = new Editor( GitHubPage.appendRoot() );

			return editor.create()
				.then( () => {
					const spy = sinon.spy( editor.rteEditor, 'destroy' );

					editor.destroy();

					expect( spy.callCount ).to.equals( 1 );
				} );
		} );

		it( 'should rollback dom changes', () => {
			const editor = new Editor( GitHubPage.appendRoot() );

			return editor.create()
				.then( () => {
					const spy = sinon.spy( editor.domManipulator, 'rollback' );

					return editor.destroy()
						.then( () => {
							expect( spy.callCount ).to.equals( 1 );
						} );
				} );
		} );
	} );

	describe( 'cleanup()', () => {
		it( 'should remove rte classes', () => {
			const root = GitHubPage.appendRoot();
			const editor = new Editor( root );

			return editor.create()
				.then( () => {
					const rootClone = GitHubPage.appendElementHtml( root.outerHTML );
					editor.destroy();
					root.remove();

					expect( rootClone.classList.contains( 'github-rte-mode-rte' ) ).be.true;

					Editor.cleanup( rootClone );

					expect( rootClone.classList.contains( 'github-rte-mode-rte' ) ).be.false;
					expect( rootClone.classList.contains( 'github-rte-mode-markdown' ) ).be.false;
				} );
		} );

		it( 'should remove markdown classes', () => {
			const root = GitHubPage.appendRoot();
			const editor = new Editor( root );

			return editor.create()
				.then( () => {
					editor.setMode( Editor.modes.MARKDOWN );

					const rootClone = GitHubPage.appendElementHtml( root.outerHTML );
					editor.destroy();
					root.remove();

					expect( rootClone.classList.contains( 'github-rte-mode-markdown' ) ).be.true;

					Editor.cleanup( rootClone );

					expect( rootClone.classList.contains( 'github-rte-mode-rte' ) ).be.false;
					expect( rootClone.classList.contains( 'github-rte-mode-markdown' ) ).be.false;
				} );
		} );

		it( 'should call the rte cleanup', () => {
			const root = GitHubPage.appendRoot();
			const editor = new Editor( root );

			return editor.create()
				.then( () => {
					const rootClone = GitHubPage.appendElementHtml( root.outerHTML );
					editor.destroy();
					root.remove();

					const spy = sinon.spy( RteEditor, 'cleanup' );

					Editor.cleanup( rootClone );

					expect( spy.callCount ).be.equals( 1 );
				} );
		} );
	} );
} );
