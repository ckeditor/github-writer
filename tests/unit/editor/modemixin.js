/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
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

				// Stubbed by GitHubPage.appendRoot().
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
				expect( editor.dom.root.classList.contains( 'github-writer-mode-rte' ), 'rte' ).to.be.false;
				expect( editor.dom.root.classList.contains( 'github-writer-mode-markdown' ), 'markdown' ).to.be.true;

				editor.setMode( Editor.modes.RTE );
				expect( editor.dom.root.classList.contains( 'github-writer-mode-rte' ), 'rte' ).to.be.true;
				expect( editor.dom.root.classList.contains( 'github-writer-mode-markdown' ), 'markdown' ).to.be.false;
			} );

			it( 'should noSynch and noCheck when setting to destroyed', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				sinon.stub( editor, 'syncData' );
				sinon.stub( editor, 'checkDataLoss' );

				editor.setMode( Editor.modes.DESTROYED );

				expect( editor.syncData.callCount, 'syncData' ).to.equals( 0 );
				expect( editor.checkDataLoss.callCount, 'checkDataLoss' ).to.equals( 0 );
			} );

			describe( 'data synch', () => {
				it( 'should synch editors by default', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					sinon.stub( editor, 'syncData' );

					editor.setMode( Editor.modes.RTE );

					expect( editor.syncData.callCount, 'callCount' ).to.equals( 1 );
				} );

				it( 'should synch editors with noSynch=false', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					sinon.stub( editor, 'syncData' );

					editor.setMode( Editor.modes.RTE, { noSynch: false } );

					expect( editor.syncData.callCount, 'callCount' ).to.equals( 1 );
				} );

				it( 'should not synch editors with noSynch=true', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					sinon.stub( editor, 'syncData' );

					editor.setMode( Editor.modes.RTE, { noSynch: true } );

					expect( editor.syncData.callCount, 'callCount' ).to.equals( 0 );
				} );
			} );

			describe( 'data check', () => {
				it( 'should check by default', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					editor.setMode( Editor.modes.MARKDOWN );

					sinon.stub( editor, 'checkDataLoss' ).returns( false );

					editor.setMode( Editor.modes.RTE );

					expect( editor.checkDataLoss.callCount, 'callCount' ).to.equals( 1 );
				} );

				it( 'should check with noCheck=false', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					editor.setMode( Editor.modes.MARKDOWN );

					sinon.stub( editor, 'checkDataLoss' ).returns( false );

					editor.setMode( Editor.modes.RTE, { noCheck: false } );

					expect( editor.checkDataLoss.callCount, 'callCount' ).to.equals( 1 );
				} );

				it( 'should not check with noCheck=true', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					editor.setMode( Editor.modes.MARKDOWN );

					sinon.stub( editor, 'checkDataLoss' ).returns( false );

					editor.setMode( Editor.modes.RTE, { noCheck: true } );

					expect( editor.checkDataLoss.callCount, 'callCount' ).to.equals( 0 );
				} );

				it( 'should ask user confirmation if data loss', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					editor.setMode( Editor.modes.MARKDOWN );

					sinon.stub( editor, 'checkDataLoss' ).returns( true );

					editor.setMode( Editor.modes.RTE );

					expect( window.confirm.callCount, 'callCount' ).to.equals( 1 );
				} );

				it( 'should ask user confirmation if data loss and abort if not confirmed', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

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
