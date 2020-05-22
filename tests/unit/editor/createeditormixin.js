/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { GitHubPage } from '../../_util/githubpage';
import Editor from '../../../src/app/editor/editor';
import CKEditorGitHubEditor from '../../../src/app/editor/ckeditorgithubeditor';
import utils from '../../../src/app/editor/utils';
import { PageIncompatibilityError } from '../../../src/app/modules/util';

describe( 'Editor', () => {
	describe( 'CreateEditorStaticMixin', () => {
		describe( 'createEditor()', () => {
			it( 'should return a promise', () => {
				const editorPromise = Editor.createEditor( GitHubPage.appendRoot() );

				expect( editorPromise ).to.be.an.instanceOf( Promise );
				return editorPromise.catch( failOnCatch );
			} );

			it( 'should return the same promise when called again', () => {
				const root = GitHubPage.appendRoot();
				const editorPromise = Editor.createEditor( root );

				return editorPromise
					.then( () => {
						expect( Editor.createEditor( root ) ).to.equals( editorPromise );
					} )
					.catch( failOnCatch );
			} );

			it( 'should accept a css selector', () => {
				const root = GitHubPage.appendRoot();
				root.classList.add( 'test-create-editor' );

				return Editor.createEditor( '.test-create-editor' )
					.then( editor => {
						expect( editor.dom.root ).to.equals( root );
					} )
					.catch( failOnCatch );
			} );

			it( 'should resolve to false if no element found for css selector', () => {
				return Editor.createEditor( 'unknown-element' )
					.then( returnValue => {
						expect( returnValue ).to.be.false;
					} )
					.catch( failOnCatch );
			} );

			it( 'should set the root id', () => {
				const root = GitHubPage.appendRoot();

				return Editor.createEditor( root )
					.then( editor => {
						expect( root.getAttribute( 'data-github-writer-id' ) ).to.equals( editor.id.toString() );
					} )
					.catch( failOnCatch );
			} );

			it( 'should reject on error', () => {
				const root = GitHubPage.appendRoot();

				// Error caused by this.
				root.querySelector( 'textarea' ).remove();

				return Editor.createEditor( root )
					.then( () => {
						expect.fail( 'the promise should reject' );
					} )
					.catch( err => {
						expect( err ).to.be.an.instanceOf( PageIncompatibilityError );
					} );
			} );

			it( 'should handle a dirty dom', () => {
				const root = GitHubPage.appendRoot();

				return Editor.createEditor( root )
					.then( editor => {
						const rootHtml = root.outerHTML;
						root.remove();
						const rootCopy = GitHubPage.appendElementHtml( rootHtml );

						expect( rootCopy.getAttribute( 'data-github-writer-id' ) )
							.to.equals( root.getAttribute( 'data-github-writer-id' ) );

						sinon.stub( Editor, 'cleanup' );

						return Editor.createEditor( rootCopy )
							.then( editorFromCopy => {
								expect( editorFromCopy.id ).to.be.greaterThan( editor.id );
								expect( Editor.cleanup.calledOnce ).to.be.true;
								expect( Editor.cleanup.firstCall.calledWithExactly( rootCopy ) ).to.be.true;
							} )
							.catch( failOnCatch );
					} )
					.catch( failOnCatch );
			} );

			it( 'should timeout (requestIdleCallback)', () => {
				const root = GitHubPage.appendRoot();

				expect( window ).to.have.property( 'requestIdleCallback' );

				const editorPromise = Editor.createEditor( root, true );

				expect( editorPromise ).to.be.an.instanceOf( Promise );

				const spy = sinon.spy( Editor, 'createEditor' );

				return editorPromise
					.then( () => {
						expect( spy.calledOnce, 'called once' ).to.be.true;
						expect( spy.firstCall.calledWithExactly( root ), 'called with root' ).to.be.true;
					} )
					.catch( failOnCatch );
			} );

			it( 'should timeout (setTimeout)', () => {
				const root = GitHubPage.appendRoot();

				const requestIdleCallback = window.requestIdleCallback;
				delete window.requestIdleCallback;

				expect( window ).to.not.have.property( 'requestIdleCallback' );

				const editorPromise = Editor.createEditor( root, true );

				expect( editorPromise ).to.be.an.instanceOf( Promise );

				const spy = sinon.spy( Editor, 'createEditor' );

				return editorPromise
					.then( () => {
						window.requestIdleCallback = requestIdleCallback;

						expect( spy.calledOnce, 'called once' ).to.be.true;
						expect( spy.firstCall.calledWithExactly( root ), 'called with root' ).to.be.true;
					} )
					.catch( failOnCatch );
			} );
		} );

		describe( 'hasEditor()', () => {
			it( 'should be true for existing editor', () => {
				const root = GitHubPage.appendRoot();
				Editor.createEditor( root );

				expect( Editor.hasEditor( root ) ).to.be.true;
			} );

			it( 'should be false for no editor', () => {
				const root = GitHubPage.appendRoot();
				Editor.createEditor( root );

				expect( Editor.hasEditor( root ) ).to.be.true;
				expect( Editor.hasEditor( document.body ) ).to.be.false;
			} );

			it( 'should be false for destroyed editor', () => {
				const root = GitHubPage.appendRoot();

				Editor.createEditor( root );
				expect( Editor.hasEditor( root ) ).to.be.true;

				Editor.destroyEditors( document.body );
				expect( Editor.hasEditor( root ) ).to.be.false;
			} );
		} );

		describe( 'destroyEditors()', () => {
			it( 'should destroy editors in a container', () => {
				const spy = sinon.spy( Editor.prototype, 'destroy' );

				// Append an editor in document.body.
				const bodyRoot = GitHubPage.appendRoot( { type: 'comment-edit' } );
				let bodyRootEditor;

				// Append two editors in a container.
				const container = GitHubPage.appendElementHtml( '<div></div>' );
				const root1 = GitHubPage.appendRoot( { type: 'comment-edit', target: container } );
				const root2 = GitHubPage.appendRoot( { type: 'comment-edit', target: container } );

				return Promise.all( [
					Editor.createEditor( bodyRoot ),
					Editor.createEditor( root1 ),
					Editor.createEditor( root2 )
				] )
					.catch( failOnCatch )
					.then( editors => {
						expect( editors.length ).to.equals( 3 );

						bodyRootEditor = editors.find( editor => editor.dom.root === bodyRoot );

						return Editor.destroyEditors( container );
					} )
					.then( () => {
						expect( spy.callCount ).to.equals( 2 );
						expect( spy.calledOn( bodyRootEditor ) ).to.be.false;
					} );
			} );

			it( 'should ignore dirty dom', () => {
				const spy = sinon.spy( Editor.prototype, 'destroy' );

				const bodyRoot = GitHubPage.appendRoot( { type: 'comment-edit' } );
				bodyRoot.setAttribute( 'data-github-writer-id', 100 );

				return Editor.destroyEditors( document.body ).then( () => {
					expect( spy.callCount ).to.equals( 0 );
				} );
			} );

			it( 'should ignore destroyed editors', () => {
				sinon.spy( Editor.prototype, 'destroy' );

				// Append 3 editors in a container.
				const container = GitHubPage.appendElementHtml( '<div></div>' );
				const root1 = GitHubPage.appendRoot( { type: 'comment-edit', target: container } );
				const root2 = GitHubPage.appendRoot( { type: 'comment-edit', target: container } );
				const root3 = GitHubPage.appendRoot( { type: 'comment-edit', target: container } );

				return Promise.all( [
					Editor.createEditor( root1 ),
					Editor.createEditor( root2 ),
					Editor.createEditor( root3 )
				] )
					.catch( failOnCatch )
					.then( () => {
						return Editor.destroyEditors( container );
					} )
					.then( () => {
						expect( Editor.prototype.destroy.callCount ).to.equals( 3 );
						Editor.prototype.destroy.resetHistory();
						return Editor.destroyEditors( container );
					} )
					.then( () => {
						expect( Editor.prototype.destroy.callCount ).to.equals( 0 );
					} );
			} );
		} );

		describe( 'cleanup()', () => {
			it( 'should remove rte classes', () => {
				const root = GitHubPage.appendRoot();
				const editor = new Editor( root );

				return editor.create()
					.then( () => {
						editor.setMode( Editor.modes.RTE );

						const rootClone = GitHubPage.appendElementHtml( root.outerHTML );
						editor.destroy();
						root.remove();

						expect( rootClone.classList.contains( 'github-writer-mode-rte' ) ).be.true;

						Editor.cleanup( rootClone );

						expect( rootClone.classList.contains( 'github-writer-mode-rte' ) ).be.false;
						expect( rootClone.classList.contains( 'github-writer-mode-markdown' ) ).be.false;
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

						expect( rootClone.classList.contains( 'github-writer-mode-markdown' ) ).be.true;

						Editor.cleanup( rootClone );

						expect( rootClone.classList.contains( 'github-writer-mode-rte' ) ).be.false;
						expect( rootClone.classList.contains( 'github-writer-mode-markdown' ) ).be.false;
					} );
			} );

			it( 'should remove editor elements', () => {
				const root = GitHubPage.appendRoot();
				const editor = new Editor( root );

				return editor.create()
					.then( () => {
						const rootClone = GitHubPage.appendElementHtml( root.outerHTML );
						editor.destroy();
						root.remove();

						expect( rootClone.querySelector( '.github-writer-panel-rte' ) ).be.an.instanceOf( HTMLElement );
						expect( rootClone.querySelector( '.github-writer-toolbar' ) ).be.an.instanceOf( HTMLElement );

						Editor.cleanup( rootClone );

						expect( rootClone.querySelector( '.github-writer-panel-rte' ) ).be.not.exist;
						expect( rootClone.querySelector( '.github-writer-toolbar' ) ).be.not.exist;
					} );
			} );
		} );
	} );

	describe( 'CreateEditorInstanceMixin', () => {
		describe( 'create()', () => {
			it( 'should return a promise that resolves to an editor', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				const promise = editor.create();

				expect( promise ).to.be.an.instanceOf( Promise );

				return promise.then( editor => {
					expect( editor ).to.be.an.instanceOf( Editor );
				} );
			} );

			it( 'should return the same promise on multiple calls', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				const promise = editor.create();

				promise.then( () => {
					expect( editor.create() ).to.equals( promise );
				} );

				return promise;
			} );

			it( 'should set the initial data', () => {
				const editor = new Editor( GitHubPage.appendRoot( { text: 'test' } ) );

				return editor.create()
					.then( () => {
						expect( editor.getData() ).to.equals( 'test' );
					} );
			} );

			it( 'should set the initial mode', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				const spy = sinon.spy( editor, 'setMode' );

				return editor.create()
					.then( () => {
						expect( spy.callCount ).to.equals( 1 );
						expect( spy.firstCall.args[ 0 ] ).to.equals( Editor.modes.RTE );
					} );
			} );

			describe( 'session resume', () => {
				it( 'should resume session data', () => {
					const root = GitHubPage.appendRoot();
					const textareaId = root.querySelector( 'textarea' ).id;
					const editor = new Editor( root );

					return editor.create()
						.then( () => {
							editor.setData( 'new data' );
							expect( sessionStorage.getItem( editor.sessionKey ) ).to.be.a( 'string' );

							return editor.destroy()
								.then( () => {
									root.remove();

									const newRoot = GitHubPage.appendRoot();
									newRoot.querySelector( 'textarea' ).id = textareaId;
									const newEditor = new Editor( newRoot );

									expect( sessionStorage.getItem( newEditor.sessionKey ) ).to.be.a( 'string' );

									return newEditor.create()
										.then( () => {
											expect( newEditor.getData() ).to.equals( 'new data' );
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
							editor.setData( 'new data' );
							editor.setMode( Editor.modes.MARKDOWN );

							return editor.destroy()
								.then( () => {
									root.remove();

									const newRoot = GitHubPage.appendRoot( { text: 'whatever new data' } );
									newRoot.querySelector( 'textarea' ).id = textareaId;
									const newEditor = new Editor( newRoot );

									return newEditor.create()
										.then( () => {
											expect( newEditor.getMode() ).to.equals( Editor.modes.MARKDOWN );
											expect( newEditor.getData() ).to.equals( 'whatever new data' );
										} );
								} );
						} );
				} );
			} );

			describe( 'ckeditor creation', () => {
				it( 'should inject the ckeditor toolbar', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					const spy = sinon.spy( editor, 'injectToolbar' );

					return editor.create()
						.then( () => {
							expect( spy.callCount ).to.equals( 1 );
						} );
				} );

				it( 'should inject the ckeditor editable (isEdit=false)', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					return editor.create()
						.then( () => {
							const editorTree = editor.dom.panelsContainer.nextSibling;
							expect( editorTree.classList.contains( 'github-writer-panel-rte' ) ).to.be.true;
						} );
				} );

				it( 'should call the toolbar postfix', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					sinon.spy( editor, 'injectToolbar' );
					sinon.spy( utils, 'toolbarItemsPostfix' );

					return editor.create()
						.then( () => {
							expect( utils.toolbarItemsPostfix.callCount ).to.equals( 1 );
							expect( utils.toolbarItemsPostfix.calledAfter( editor.injectToolbar ) ).to.be.true;
						} );
				} );

				it( 'should cross reference Editor <-> CKEditor', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					return editor.create()
						.then( () => {
							expect( editor.ckeditor ).to.be.an.instanceOf( CKEditorGitHubEditor );
							expect( editor.ckeditor.githubEditor ).to.equals( editor );
						} );
				} );

				it( 'should load data that was set before create()', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					editor.setCKEditorData( 'Test' );

					return editor.create()
						.then( () => {
							expect( editor.getCKEditorData() ).to.equals( 'Test' );
						} );
				} );

				it( 'should fire "reallyReady" on ckeditor', () => {
					const editor = new Editor( GitHubPage.appendRoot() );

					const spy = sinon.spy( CKEditorGitHubEditor.prototype, 'fire' ).withArgs( 'reallyReady' );

					return editor.create()
						.then( () => {
							expect( spy.callCount ).to.equals( 1 );
						} );
				} );
			} );
		} );

		describe( 'destroy()', () => {
			it( 'should resolve to true if editor created', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( () => {
						return editor.destroy().then( returnValue => {
							expect( returnValue ).to.be.true;
						} );
					} );
			} );

			it( 'should resolve to false if no editor created', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.destroy().then( returnValue => {
					expect( returnValue ).to.be.false;
				} );
			} );

			it( 'should wait for creation to destroy', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				editor.create();

				expect( editor.ckeditor ).to.be.undefined;

				const spy = sinon.spy( CKEditorGitHubEditor.prototype, 'destroy' );

				return editor.destroy().then( destroyed => {
					expect( destroyed ).to.be.true;
					expect( spy.callCount ).to.equals( 1 );
				} );
			} );

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

			it( 'should destroy ckeditor', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( () => {
						const spy = sinon.spy( editor.ckeditor, 'destroy' );

						return editor.destroy().then( () => {
							expect( spy.callCount ).to.equals( 1 );
						} );
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

		describe( 'injectToolbar()', () => {
			it( 'should inject the toolbar after the markdown toolbar', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const toolbar = document.createElement( 'div' );

				editor.injectToolbar( toolbar );

				expect( editor.dom.toolbar.nextElementSibling ).to.equals( toolbar );
			} );
		} );

		describe( 'createEditableContainer()', () => {
			it( 'should return an element with class github-writer-panel-rte', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				const tree = editor.createEditableContainer( document.createElement( 'div' ) );
				expect( tree ).to.be.an.instanceOf( HTMLElement );
				expect( tree.classList.contains( 'github-writer-panel-rte' ) ).to.be.true;
			} );

			it( 'should have an element with class github-writer-ckeditor', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				const tree = editor.createEditableContainer( document.createElement( 'div' ) );
				expect( tree.querySelector( '.github-writer-ckeditor' ) ).to.be.an.instanceOf( HTMLElement );
			} );

			it( 'should inject the editable inside github-writer-ckeditor', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const editable = document.createElement( 'div' );

				editor.createEditableContainer( editable );
				expect( editable.parentElement.classList.contains( 'github-writer-ckeditor' ) ).to.be.true;
			} );
		} );
	} );
} );

function failOnCatch( err ) {
	expect.fail( err.message + '\n' + err.stack );
}
