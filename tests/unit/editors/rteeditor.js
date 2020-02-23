/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../../../src/app/editor';
import RteEditor, { CKEditorGitHubEditor } from '../../../src/app/editors/rteeditor';

import RteEditorConfig from '../../../src/app/editors/rteeditorconfig';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';

import { GitHubPage } from '../../_util/githubpage';

describe( 'Editors', () => {
	describe( 'RteEditor', () => {
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
		} );

		describe( 'constructor()', () => {
			it( 'should save a reference to the parent editor', () => {
				const root = GitHubPage.appendRoot();
				const editor = new Editor( root );
				const rteEditor = new RteEditor( editor );

				expect( rteEditor.githubEditor ).to.equals( editor );
			} );
		} );

		describe( 'getData()', () => {
			it( 'should get data from ckeditor', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				return rteEditor.create()
					.then( () => {
						const spy = sinon.spy( rteEditor.ckeditor, 'getData' );
						rteEditor.getData();
						expect( spy.callCount ).to.equals( 1 );

						return rteEditor.destroy(); // After test cleanup.
					} );
			} );

			it( 'should return empty if not created', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot( { text: 'test' } ) ) );

				expect( rteEditor.ckeditor ).to.be.undefined;
				expect( rteEditor.getData() ).to.equals( '' );
			} );

			it( 'should return pending data if not created', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				expect( rteEditor.ckeditor ).to.be.undefined;
				rteEditor.setData( 'test' );
				expect( rteEditor.getData() ).to.equals( 'test' );
			} );
		} );

		describe( 'setData()', () => {
			it( 'should set data into ckeditor', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				return rteEditor.create()
					.then( () => {
						const spy = sinon.spy( rteEditor.ckeditor, 'setData' );
						rteEditor.setData( 'test' );
						expect( spy.callCount ).to.equals( 1 );
						expect( spy.firstCall.args[ 0 ] ).to.equals( 'test' );

						return rteEditor.destroy(); // After test cleanup.
					} );
			} );

			it( 'should set data before ckeditor creation', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				expect( rteEditor.ckeditor ).to.be.undefined;
				rteEditor.setData( 'test' );
				expect( rteEditor.getData() ).to.equals( 'test' );

				return rteEditor.create()
					.then( () => {
						expect( rteEditor.getData() ).to.equals( 'test' );

						return rteEditor.destroy(); // After test cleanup.
					} );
			} );
		} );

		describe( 'create()', () => {
			it( 'should return a promise that resolves to nothing', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				const promise = rteEditor.create()
					.then( resolution => {
						expect( resolution ).to.be.undefined;

						return rteEditor.destroy(); // After test cleanup.
					} );

				expect( promise ).to.be.an.instanceOf( Promise );
				return promise;
			} );

			it( 'should return the same promise on multiple calls', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				const promise = rteEditor.create();

				promise.then( () => {
					expect( rteEditor.create() ).to.equals( promise );

					return rteEditor.destroy(); // After test cleanup.
				} );

				return promise;
			} );

			it( 'should inject the ckeditor toolbar', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				const spy = sinon.spy( rteEditor, 'injectToolbar' );

				return rteEditor.create()
					.then( () => {
						expect( spy.callCount ).to.equals( 1 );

						return rteEditor.destroy(); // After test cleanup.
					} );
			} );

			it( 'should inject the ckeditor editable (isEdit=true)', () => {
				const editor = new Editor( GitHubPage.appendRoot( { type: 'comment-edit' } ) );
				const rteEditor = new RteEditor( editor );

				expect( editor.markdownEditor.isEdit ).to.be.true;

				return rteEditor.create()
					.then( () => {
						const editorTree = editor.markdownEditor.dom.panels.preview.nextSibling;
						expect( editorTree.classList.contains( 'github-rte-panel-rte' ) ).to.be.true;

						return rteEditor.destroy(); // After test cleanup.
					} );
			} );

			it( 'should inject the ckeditor editable (isEdit=false)', () => {
				const editor = new Editor( GitHubPage.appendRoot( { type: 'issue' } ) );
				const rteEditor = new RteEditor( editor );

				expect( editor.markdownEditor.isEdit ).to.be.false;

				return rteEditor.create()
					.then( () => {
						const editorTree = editor.markdownEditor.dom.panelsContainer.nextSibling;
						expect( editorTree.classList.contains( 'github-rte-panel-rte' ) ).to.be.true;

						return rteEditor.destroy(); // After test cleanup.
					} );
			} );

			it( 'should call the toolbar postfix', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				sinon.spy( rteEditor, 'injectToolbar' );

				// Stubbed in beforeEach.
				// sinon.spy( RteEditor, 'toolbarItemsPostfix' );

				return rteEditor.create()
					.then( () => {
						expect( RteEditor.toolbarItemsPostfix.callCount ).to.equals( 1 );
						expect( RteEditor.toolbarItemsPostfix.calledAfter( rteEditor.injectToolbar ) ).to.be.true;

						return rteEditor.destroy(); // After test cleanup.
					} );
			} );

			it( 'should cross reference Editor <-> CKEditor', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const rteEditor = new RteEditor( editor );

				return rteEditor.create()
					.then( () => {
						expect( rteEditor.ckeditor ).to.be.an.instanceOf( CKEditorGitHubEditor );
						expect( rteEditor.ckeditor.githubEditor ).to.equals( editor );

						return rteEditor.destroy(); // After test cleanup.
					} );
			} );

			it( 'should fire "reallyReady" on ckeditor', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				const spy = sinon.spy( CKEditorGitHubEditor.prototype, 'fire' ).withArgs( 'reallyReady' );

				return rteEditor.create()
					.then( () => {
						expect( spy.callCount ).to.equals( 1 );

						return rteEditor.destroy(); // After test cleanup.
					} );
			} );
		} );

		describe( 'destroy()', () => {
			it( 'should return a promise that resolves to true', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				return rteEditor.create()
					.then( () => {
						const promise = rteEditor.destroy();
						expect( promise ).to.be.an.instanceOf( Promise );
						return promise
							.then( destroyed => {
								expect( destroyed ).to.be.true;
							} );
					} );
			} );

			it( 'should destroy ckeditor', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				return rteEditor.create()
					.then( () => {
						const spy = sinon.spy( rteEditor.ckeditor, 'destroy' );
						return rteEditor.destroy()
							.then( () => {
								expect( spy.callCount ).to.equals( 1 );
							} );
					} );
			} );

			it( 'should resolve to false if not created yet', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				return rteEditor.destroy().then( destroyed => {
					expect( destroyed ).to.be.false;
				} );
			} );

			it( 'should wait for creation to destroy', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				rteEditor.create();

				expect( rteEditor.ckeditor ).to.be.undefined;

				const spy = sinon.spy( CKEditorGitHubEditor.prototype, 'destroy' );

				return rteEditor.destroy().then( destroyed => {
					expect( destroyed ).to.be.true;
					expect( spy.callCount ).to.equals( 1 );
				} );
			} );
		} );

		describe( 'cleanup()', () => {
			it( 'should remove editor elements', () => {
				const root = GitHubPage.appendRoot();
				const editor = new Editor( root );

				return editor.create()
					.then( () => {
						const rootClone = GitHubPage.appendElementHtml( root.outerHTML );
						editor.destroy();
						root.remove();

						expect( rootClone.querySelector( '.github-rte-panel-rte' ) ).be.an.instanceOf( HTMLElement );
						expect( rootClone.querySelector( '.github-rte-toolbar' ) ).be.an.instanceOf( HTMLElement );

						Editor.cleanup( rootClone );

						expect( rootClone.querySelector( '.github-rte-panel-rte' ) ).be.not.exist;
						expect( rootClone.querySelector( '.github-rte-toolbar' ) ).be.not.exist;
					} );
			} );
		} );
	} );
} );
