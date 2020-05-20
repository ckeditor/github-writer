/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../../../src/app/editor';
import RteEditor from '../../../src/app/editors/rteeditor';
import CKEditorGitHubEditor from '../../../src/app/editor/ckeditorgithubeditor';

import CKEditorConfig from '../../../src/app/editor/ckeditorconfig';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Emoji from '../../../src/app/plugins/emoji';
import EditorExtras from '../../../src/app/plugins/editorextras';

import Locale from '@ckeditor/ckeditor5-utils/src/locale';
import ToolbarView from '@ckeditor/ckeditor5-ui/src/toolbar/toolbarview';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import LabelView from '@ckeditor/ckeditor5-ui/src/label/labelview';
import DropdownView from '@ckeditor/ckeditor5-ui/src/dropdown/dropdownview';
import DropdownPanelView from '@ckeditor/ckeditor5-ui/src/dropdown/dropdownpanelview';

import { GitHubPage } from '../../_util/githubpage';
import env from '@ckeditor/ckeditor5-utils/src/env';
import { getData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';

describe( 'Editors', () => {
	describe( 'RteEditor', () => {
		beforeEach( () => {
			sinon.stub( CKEditorConfig, 'get' ).returns( { plugins: [ Paragraph, Emoji ] } );
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

			it( 'should not have nbsp before emojis', () => {
				const text = 'Test :tada: and :octocat:';
				const editor = new Editor( GitHubPage.appendRoot( { text } ) );

				return editor.create()
					.then( () => {
						// Be sure that we have emojis.
						expect( getData( editor.rteEditor.ckeditor.model, { withoutSelection: true } ) ).to.equals(
							'<paragraph>Test <emoji name="tada"></emoji> and <emoji name="octocat"></emoji></paragraph>' );

						expect( editor.rteEditor.getData() ).to.equals( text );

						return editor.destroy(); // After test cleanup.
					} );
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

		describe( 'focus()', () => {
			it( 'should set focus into ckeditor', () => {
				// Stubbed in beforeEach.
				CKEditorConfig.get.returns( { plugins: [ Paragraph, EditorExtras ] } );

				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				return rteEditor.create()
					.then( () => {
						const spy = sinon.spy( rteEditor.ckeditor, 'focus' );
						rteEditor.focus();
						expect( spy.callCount ).to.equals( 1 );

						return rteEditor.destroy(); // After test cleanup.
					} );
			} );

			it( 'should do nothing before ckeditor creation', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				expect( () => rteEditor.focus() ).to.not.throw();
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
						expect( editorTree.classList.contains( 'github-writer-panel-rte' ) ).to.be.true;

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
						expect( editorTree.classList.contains( 'github-writer-panel-rte' ) ).to.be.true;

						return rteEditor.destroy(); // After test cleanup.
					} );
			} );

			it( 'should call the toolbar postfix', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				sinon.spy( rteEditor, 'injectToolbar' );
				sinon.spy( RteEditor, 'toolbarItemsPostfix' );

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

			it( 'should load data that was set before create()', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const rteEditor = new RteEditor( editor );

				rteEditor.setData( 'Test' );

				return rteEditor.create()
					.then( () => {
						expect( rteEditor.getData() ).to.equals( 'Test' );

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

		describe( 'injectToolbar()', () => {
			it( 'should inject the toolbar after the markdown toolbar', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const rteEditor = new RteEditor( editor );
				const toolbar = document.createElement( 'div' );

				rteEditor.injectToolbar( toolbar );

				expect( editor.markdownEditor.dom.toolbar.nextElementSibling ).to.equals( toolbar );
			} );
		} );

		describe( 'getEditableParentTree()', () => {
			it( 'should return an element with class github-writer-panel-rte', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				const tree = rteEditor.getEditableParentTree();
				expect( tree ).to.be.an.instanceOf( HTMLElement );
				expect( tree.classList.contains( 'github-writer-panel-rte' ) ).to.be.true;
			} );

			it( 'should have an element with class github-writer-ckeditor', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				const tree = rteEditor.getEditableParentTree();
				expect( tree.querySelector( '.github-writer-ckeditor' ) ).to.be.an.instanceOf( HTMLElement );
			} );
		} );

		describe( 'toolbarItemsPostfix()', () => {
			beforeEach( () => {
				GitHubPage.appendElementHtml(
					'<div>' +
					'<md-bold aria-label="test Bold"></md-bold>' +
					'</div>'
				);
			} );

			it( 'should fix simple buttons', () => {
				const locale = new Locale();
				const toolbar = new ToolbarView( locale );

				const button = new ButtonView( locale );
				button.set( {
					label: 'Bold',
					tooltip: true
				} );

				toolbar.items.add( button );

				// Check if it's rendered just as a future safeguard because we've removing part of the code inside
				// toolbarItemsPostfix which was dealing with the non-rendered case when writing this test.
				// Somehow this seems to not be possible anymore to have toolbars with non-rendered items,
				// but we don't know if this may change in the future.
				expect( button.isRendered ).to.be.true;

				RteEditor.toolbarItemsPostfix( toolbar );

				expect( button.tooltip ).to.be.false;
				expect( button.element.getAttribute( 'aria-label' ) ).to.equals( 'test Bold' );
			} );

			it( 'should fix complex buttons', () => {
				const locale = new Locale();
				const toolbar = new ToolbarView( locale );

				const button = new ButtonView( locale );
				button.set( {
					label: 'Bold',
					tooltip: true
				} );

				const dropdown = new DropdownView( locale, button, new DropdownPanelView( locale ) );

				toolbar.items.add( dropdown );

				RteEditor.toolbarItemsPostfix( toolbar );

				expect( button.tooltip ).to.be.false;
				expect( button.element.getAttribute( 'aria-label' ) ).to.equals( 'test Bold' );
			} );

			it( 'should properly set cmd', () => {
				const locale = new Locale();
				const toolbar = new ToolbarView( locale );

				const button = new ButtonView( locale );
				button.set( {
					label: 'Keyboard shortcut',
					tooltip: true
				} );

				toolbar.items.add( button );

				// Check if it's rendered just as a future safeguard because we've removing part of the code inside
				// toolbarItemsPostfix which was dealing with the non-rendered case when writing this test.
				// Somehow this seems to not be possible anymore to have toolbars with non-rendered items,
				// but we don't know if this may change in the future.
				expect( button.isRendered ).to.be.true;

				env.isMac = true;
				RteEditor.toolbarItemsPostfix( toolbar );

				expect( button.tooltip ).to.be.false;
				expect( button.element.getAttribute( 'aria-label' ) ).to.equals( 'Add keyboard shortcut <cmd+alt-k>' );
			} );

			it( 'should properly set ctrl', () => {
				const locale = new Locale();
				const toolbar = new ToolbarView( locale );

				const button = new ButtonView( locale );
				button.set( {
					label: 'Keyboard shortcut',
					tooltip: true
				} );

				toolbar.items.add( button );

				// Check if it's rendered just as a future safeguard because we've removing part of the code inside
				// toolbarItemsPostfix which was dealing with the non-rendered case when writing this test.
				// Somehow this seems to not be possible anymore to have toolbars with non-rendered items,
				// but we don't know if this may change in the future.
				expect( button.isRendered ).to.be.true;

				env.isMac = false;
				RteEditor.toolbarItemsPostfix( toolbar );

				expect( button.tooltip ).to.be.false;
				expect( button.element.getAttribute( 'aria-label' ) ).to.equals( 'Add keyboard shortcut <ctrl+alt-k>' );
			} );

			it( 'should not fix unknown buttons', () => {
				const locale = new Locale();
				const toolbar = new ToolbarView( locale );

				const button = new ButtonView( locale );
				button.set( {
					label: 'Test',
					tooltip: true
				} );

				toolbar.items.add( button );

				RteEditor.toolbarItemsPostfix( toolbar );

				expect( button.tooltip ).to.be.false;
				expect( button.element.getAttribute( 'aria-label' ) ).to.equals( 'Test' );
			} );

			it( 'should ignore non buttons', () => {
				const locale = new Locale();
				const toolbar = new ToolbarView( locale );

				const label = new LabelView( locale );
				label.set( {
					text: 'Test',
					tooltip: true
				} );

				toolbar.items.add( label );

				RteEditor.toolbarItemsPostfix( toolbar );

				expect( label.tooltip ).to.be.true;
				expect( label.element.getAttribute( 'aria-label' ) ).to.be.null;
			} );

			it( 'should do nothing in non comments page', () => {
				GitHubPage.setPageName( 'repo_wiki' );

				const locale = new Locale();
				const toolbar = new ToolbarView( locale );

				const button = new ButtonView( locale );
				button.set( {
					label: 'Bold',
					tooltip: true
				} );

				toolbar.items.add( button );

				expect( button.isRendered ).to.be.true;

				RteEditor.toolbarItemsPostfix( toolbar );

				expect( button.tooltip ).to.be.true;
				expect( button.element.getAttribute( 'aria-label' ) ).to.be.null;
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

						expect( rootClone.querySelector( '.github-writer-panel-rte' ) ).be.an.instanceOf( HTMLElement );
						expect( rootClone.querySelector( '.github-writer-toolbar' ) ).be.an.instanceOf( HTMLElement );

						Editor.cleanup( rootClone );

						expect( rootClone.querySelector( '.github-writer-panel-rte' ) ).be.not.exist;
						expect( rootClone.querySelector( '.github-writer-toolbar' ) ).be.not.exist;
					} );
			} );
		} );
	} );
} );
