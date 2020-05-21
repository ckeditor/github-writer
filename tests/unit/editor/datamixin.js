/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../../../src/app/editor/editor';
import { GitHubPage } from '../../_util/githubpage';
import { getData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import CKEditorConfig from '../../../src/app/editor/ckeditorconfig';

describe( 'Editor', () => {
	describe( 'DataMixin', () => {
		describe( 'getData()', () => {
			it( 'should get data from ckeditor', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( () => {
						const spy = sinon.spy( editor.ckeditor, 'getData' );
						editor.getData();
						expect( spy.callCount ).to.equals( 1 );

						return editor.destroy(); // After test cleanup.
					} );
			} );

			it( 'should get from the textarea if not created', () => {
				const editor = new Editor( GitHubPage.appendRoot( { text: 'test' } ) );

				expect( editor.ckeditor ).to.be.undefined;
				expect( editor.getData() ).to.equals( 'test' );
			} );

			it( 'should return pending data if not created', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				expect( editor.ckeditor ).to.be.undefined;
				editor.setData( 'test' );
				expect( editor.getData() ).to.equals( 'test' );
			} );

			it( 'should not have nbsp before emojis', () => {
				CKEditorConfig.get.restore();

				const text = 'Test :tada: and :octocat:';
				const editor = new Editor( GitHubPage.appendRoot( { text } ) );

				return editor.create()
					.then( () => {
						// Be sure that we have emojis.
						expect( getData( editor.ckeditor.model, { withoutSelection: true } ) ).to.equals(
							'<paragraph>Test <emoji name="tada"></emoji> and <emoji name="octocat"></emoji></paragraph>' );

						expect( editor.getData() ).to.equals( text );
					} );
			} );

			it( 'should get the value from the textarea', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create().then( editor => {
					editor.setMode( Editor.modes.MARKDOWN );
					editor.dom.textarea.value = 'Test';

					expect( editor.getData() ).to.equals( 'Test' );
				} );
			} );
		} );

		describe( 'getCKEditorData()', () => {
			it( 'should get data from ckeditor', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( () => {
						const spy = sinon.spy( editor.ckeditor, 'getData' );
						editor.getCKEditorData();
						expect( spy.callCount ).to.equals( 1 );

						return editor.destroy(); // After test cleanup.
					} );
			} );

			it( 'should get pending data if not created', () => {
				const editor = new Editor( GitHubPage.appendRoot( { text: 'initial data' } ) );

				editor.setCKEditorData( 'test' );

				expect( editor.ckeditor ).to.be.undefined;
				expect( editor.getCKEditorData() ).to.equals( 'test' );
			} );

			it( 'should return empty if no pending data and not created', () => {
				const editor = new Editor( GitHubPage.appendRoot( { text: 'initial data' } ) );

				expect( editor.ckeditor ).to.be.undefined;
				expect( editor.getCKEditorData() ).to.equals( '' );
			} );
		} );

		describe( 'setData()', () => {
			it( 'should set data into ckeditor', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( () => {
						const spy = sinon.spy( editor.ckeditor, 'setData' );
						editor.setData( 'test' );
						expect( spy.callCount ).to.equals( 1 );
						expect( spy.firstCall.args[ 0 ] ).to.equals( 'test' );

						return editor.destroy(); // After test cleanup.
					} );
			} );

			it( 'should set data before ckeditor creation', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				expect( editor.ckeditor ).to.be.undefined;
				editor.setData( 'test' );
				expect( editor.getData() ).to.equals( 'test' );

				return editor.create()
					.then( () => {
						expect( editor.getData() ).to.equals( 'test' );

						return editor.destroy(); // After test cleanup.
					} );
			} );

			it( 'should set the value in the textarea when markdown', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create().then( editor => {
					editor.setMode( Editor.modes.MARKDOWN );
					editor.setData( 'Test' );

					expect( editor.dom.textarea.value ).to.equals( 'Test' );
				} );
			} );

			// it( 'should not reset the default value by default', () => {
			// 	const editor = new Editor( GitHubPage.appendRoot() );
			//
			// 	editor.setData( 'Test' );
			//
			// 	expect( editor.dom.textarea.defaultValue ).to.equals( '' );
			// } );

			// it( 'should allow to reset the default value', () => {
			// 	const editor = new Editor( GitHubPage.appendRoot() );
			//
			// 	editor.setData( 'Test', true );
			//
			// 	expect( editor.dom.textarea.value ).to.equals( 'Test' );
			// 	expect( editor.dom.textarea.defaultValue ).to.equals( 'Test' );
			// } );
		} );

		describe( 'setCKEditorData()', () => {
			it( 'should get data from ckeditor', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( () => {
						const spy = sinon.spy( editor.ckeditor, 'setData' );
						editor.setCKEditorData( 'test' );
						expect( spy.callCount ).to.equals( 1 );
						expect( spy.alwaysCalledWith( 'test' ) );
					} );
			} );

			it( 'should set pending data if not created', () => {
				const editor = new Editor( GitHubPage.appendRoot( { text: 'initial data' } ) );

				editor.setCKEditorData( 'test' );

				expect( editor.ckeditor ).to.be.undefined;
				expect( editor.getCKEditorData() ).to.equals( 'test' );
			} );
		} );

		describe( 'syncData()', () => {
			it( 'should sync rte to markdown', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( () => {
						editor.setMode( Editor.modes.RTE );
						editor.setData( 'test' );
						expect( editor.dom.textarea.value ).to.equals( '' );

						editor.syncData();
						expect( editor.dom.textarea.value ).to.equals( 'test' );
					} );
			} );

			it( 'should sync markdown to rte', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( () => {
						editor.setMode( Editor.modes.MARKDOWN );
						editor.setData( 'test' );
						expect( editor.ckeditor.getData() ).to.equals( '' );

						editor.syncData();
						expect( editor.ckeditor.getData() ).to.equals( 'test' );
					} );
			} );

			it( 'should clean session storage', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( () => {
						editor.setData( 'test' );
						expect( sessionStorage.getItem( editor.sessionKey ) ).to.be.a( 'string' );

						editor.syncData();
						expect( sessionStorage.getItem( editor.sessionKey ) ).to.be.null;
					} );
			} );

			it( 'should fire "sync" (rte)', done => {
				const editor = new Editor( GitHubPage.appendRoot() );

				editor.on( 'sync', () => done() );

				editor.create()
					.then( () => {
						editor.setMode( Editor.modes.RTE );
						editor.setData( 'test' );
						editor.syncData();
					} );
			} );

			it( 'should fire "sync" (markdown)', done => {
				const editor = new Editor( GitHubPage.appendRoot() );

				editor.on( 'sync', () => done() );

				editor.create()
					.then( () => {
						editor.setMode( Editor.modes.MARKDOWN );
						editor.setData( 'test' );
						editor.syncData();
					} );
			} );
		} );

		describe( 'checkDataLoss()', () => {
			it( 'should be false for identical data', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( () => {
						const data = 'test';
						editor.setCKEditorData( data );
						editor.dom.textarea.value = data;

						expect( editor.checkDataLoss() ).to.be.false;
					} );
			} );

			it( 'should be false for differences on space only', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( () => {
						const data = 'test    this\n\n\n ok\n\n\n\n\ntest';
						editor.setCKEditorData( data );
						editor.dom.textarea.value = data;

						expect( editor.checkDataLoss() ).to.be.false;
					} );
			} );

			it( 'should be true for incompatible data', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( () => {
						const data = '<my> test';
						editor.setCKEditorData( data );
						editor.dom.textarea.value = data;

						expect( editor.checkDataLoss() ).to.be.true;
					} );
			} );
		} );
	} );
} );
