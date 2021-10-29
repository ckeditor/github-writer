/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../../../src/app/editor/editor';
import { GitHubPage } from '../../_util/githubpage';

describe( 'Editor', () => {
	describe( 'ModeMixin', () => {
		describe( 'getMode()', () => {
			it( 'should be unknown on start', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				expect( editor.getMode() ).to.equals( Editor.modes.UNKNOWN );
			} );

			[ Editor.modes.RTE, Editor.modes.MARKDOWN, Editor.modes.DESTROYED ].forEach( mode => {
				it( `should get the mode (${ mode })`, () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					return editor.create().then( () => {
						if ( mode === Editor.modes.DESTROYED ) {
							return editor.destroy().then( () => {
								expect( editor.getMode() ).to.equals( mode );
							} );
						} else {
							editor.setMode( mode, { noCheck: true, noSynch: true } );
							expect( editor.getMode() ).to.equals( mode );
						}
					} );
				} );
			} );
		} );

		describe( 'setMode()', () => {
			let editor;

			beforeEach( () => {
				editor = new Editor( GitHubPage.appendRoot() );
				return editor.create();
			} );

			afterEach( () => {
				editor.destroy();
			} );

			beforeEach( () => {
				sinon.stub( window, 'confirm' ).returns( true );
			} );

			it( 'should fire the "mode" event', () => {
				editor.setMode( Editor.modes.RTE );

				editor.once( 'mode', ( ev, { from, to } ) => {
					expect( from ).to.equals( Editor.modes.RTE );
					expect( to ).to.equals( Editor.modes.MARKDOWN );
					expect( editor.getMode() ).to.equals( Editor.modes.MARKDOWN );
				} );

				editor.setMode( Editor.modes.MARKDOWN );
			} );

			it( 'should not fire the "mode" event if no mode change', () => {
				let tested = false;

				editor.setMode( Editor.modes.MARKDOWN );

				editor.once( 'mode', () => {
					if ( !tested ) {
						expect.fail( 'the mode event was fired' );
					}
				} );

				editor.setMode( Editor.modes.MARKDOWN );

				tested = true;
			} );

			it( 'should _setSubmitStatus when moving to rte', () => {
				editor.setMode( Editor.modes.MARKDOWN );

				const spy = sinon.spy( editor, '_setSubmitStatus' );

				editor.setMode( Editor.modes.RTE );
				expect( spy.callCount ).to.equals( 1 );
			} );

			it( 'should not_setSubmitStatus when moving to markdown', () => {
				const spy = sinon.spy( editor, '_setSubmitStatus' );
				editor.setMode( Editor.modes.MARKDOWN );
				expect( spy.callCount ).to.equals( 0 );
			} );

			it( 'should click the write tab', () => {
				// Stubbed by GitHubPage.appendRoot().
				const stub = editor.dom.tabs.write.click;

				expect( stub.callCount ).to.equals( 0 );

				editor.setMode( Editor.modes.MARKDOWN );
				expect( stub.callCount ).to.equals( 1 );

				editor.setMode( Editor.modes.RTE );
				expect( stub.callCount ).to.equals( 2 );

				editor.setMode( Editor.modes.MARKDOWN );
				expect( stub.callCount ).to.equals( 3 );

				// Expect to be not called on destroy.
				return editor.destroy().then( () => {
					expect( stub.callCount ).to.equals( 3 );
				} );
			} );

			it( 'should set root classes', () => {
				editor.setMode( Editor.modes.MARKDOWN );
				expect( editor.dom.root.classList.contains( 'github-writer-mode-rte' ), 'rte' ).to.be.false;
				expect( editor.dom.root.classList.contains( 'github-writer-mode-markdown' ), 'markdown' ).to.be.true;

				editor.setMode( Editor.modes.RTE );
				expect( editor.dom.root.classList.contains( 'github-writer-mode-rte' ), 'rte' ).to.be.true;
				expect( editor.dom.root.classList.contains( 'github-writer-mode-markdown' ), 'markdown' ).to.be.false;
			} );

			it( 'should noSynch and noCheck when setting to destroyed', () => {
				sinon.stub( editor, 'syncData' );
				sinon.stub( editor, 'checkDataLoss' );

				return editor.destroy().then( () => {
					expect( editor.syncData.callCount, 'syncData' ).to.equals( 0 );
					expect( editor.checkDataLoss.callCount, 'checkDataLoss' ).to.equals( 0 );
				} );
			} );

			it( 'should fire textarea.change when switching to the markdown mode', done => {
				GitHubPage.domManipulator.addEventListener( editor.dom.textarea, 'change', () => done() );

				editor.setMode( Editor.modes.MARKDOWN );
			} );

			it( 'should not fire textarea.change when switching to rte mode', () => {
				editor.setMode( Editor.modes.MARKDOWN );

				GitHubPage.domManipulator.addEventListener( editor.dom.textarea, 'change', () => {
					expect.fail( 'Event should not be fired.' );
				} );

				editor.setMode( Editor.modes.RTE );
			} );

			describe( 'data synch', () => {
				it( 'should synch editors by default', () => {
					sinon.stub( editor, 'syncData' );

					editor.setMode( Editor.modes.MARKDOWN );

					expect( editor.syncData.callCount, 'callCount' ).to.equals( 1 );
				} );

				it( 'should synch editors with noSynch=false', () => {
					sinon.stub( editor, 'syncData' );

					editor.setMode( Editor.modes.MARKDOWN, { noSynch: false } );

					expect( editor.syncData.callCount, 'callCount' ).to.equals( 1 );
				} );

				it( 'should not synch editors with noSynch=true', () => {
					sinon.stub( editor, 'syncData' );

					editor.setMode( Editor.modes.MARKDOWN, { noSynch: true } );

					expect( editor.syncData.callCount, 'callCount' ).to.equals( 0 );
				} );
			} );

			describe( 'data check', () => {
				it( 'should check by default', () => {
					editor.setMode( Editor.modes.MARKDOWN );

					sinon.stub( editor, 'checkDataLoss' ).returns( false );

					editor.setMode( Editor.modes.RTE );

					expect( editor.checkDataLoss.callCount, 'callCount' ).to.equals( 1 );
				} );

				it( 'should check with noCheck=false', () => {
					editor.setMode( Editor.modes.MARKDOWN );

					sinon.stub( editor, 'checkDataLoss' ).returns( false );

					editor.setMode( Editor.modes.RTE, { noCheck: false } );

					expect( editor.checkDataLoss.callCount, 'callCount' ).to.equals( 1 );
				} );

				it( 'should not check with noCheck=true', () => {
					editor.setMode( Editor.modes.MARKDOWN );

					sinon.stub( editor, 'checkDataLoss' ).returns( false );

					editor.setMode( Editor.modes.RTE, { noCheck: true } );

					expect( editor.checkDataLoss.callCount, 'callCount' ).to.equals( 0 );
				} );

				it( 'should ask user confirmation if data loss', () => {
					editor.setMode( Editor.modes.MARKDOWN );

					sinon.stub( editor, 'checkDataLoss' ).returns( true );

					editor.setMode( Editor.modes.RTE );

					expect( window.confirm.callCount, 'callCount' ).to.equals( 1 );
				} );

				it( 'should ask user confirmation if data loss and abort if not confirmed', () => {
					editor.setMode( Editor.modes.MARKDOWN );

					sinon.stub( editor, 'checkDataLoss' ).returns( true );
					window.confirm.returns( false );

					editor.setMode( Editor.modes.RTE );

					expect( window.confirm.callCount, 'callCount' ).to.equals( 1 );
					expect( editor.getMode() ).to.equals( Editor.modes.MARKDOWN );
				} );
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
	} );
} );
