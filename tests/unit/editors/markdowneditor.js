/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../../../src/app/editor';
import MarkdownEditor from '../../../src/app/editors/markdowneditor';
import { PageIncompatibilityError } from '../../../src/app/util';

import { GitHubPage } from '../../_util/githubpage';

describe( 'Editors', () => {
	describe( 'MarkdownEditor', () => {
		beforeEach( () => {
			// Mute dev logging.
			sinon.stub( console, 'log' ).callsFake( ( ...args ) => {
				if ( !( args[ 1 ] instanceof Editor ) ) {
					console.log.wrappedMethod.apply( console, args );
				}
			} );
		} );

		describe( 'constructor()', () => {
			it( 'should save dom references', () => {
				const root = GitHubPage.appendRoot();
				const editor = new Editor( root );
				const markdownEditor = new MarkdownEditor( editor );

				expect( markdownEditor ).to.have.property( 'dom' );
				expect( markdownEditor.dom.root ).to.equals( root );
			} );

			it( 'should save preview tab when in comment edit', () => {
				const root = GitHubPage.appendRoot( { type: 'comment-edit' } );
				const editor = new Editor( root );
				const markdownEditor = new MarkdownEditor( editor );

				expect( markdownEditor ).to.have.property( 'dom' );
				expect( markdownEditor.dom.panels.preview ).to.be.an.instanceOf( HTMLElement );
			} );

			it( 'should throw error on invalid dom', () => {
				const root = GitHubPage.appendRoot();
				root.querySelector( 'markdown-toolbar' ).remove();

				expect( () => new Editor( root ) ).to.throw( PageIncompatibilityError );
			} );

			it( 'should set isEdit to false when not edit', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const markdownEditor = new MarkdownEditor( editor );

				expect( markdownEditor.isEdit ).to.be.false;
			} );

			it( 'should set isEdit to true when edit', () => {
				const editor = new Editor( GitHubPage.appendRoot( { type: 'comment-edit' } ) );
				const markdownEditor = new MarkdownEditor( editor );

				expect( markdownEditor.isEdit ).to.be.true;
			} );

			it( 'should add css classes to the panel elements', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const markdownEditor = new MarkdownEditor( editor );

				expect( markdownEditor.dom.panels.markdown.classList.contains( 'github-rte-panel-markdown' ) ).to.be.true;
				expect( markdownEditor.dom.panels.preview.classList.contains( 'github-rte-panel-preview' ) ).to.be.true;
			} );

			it( 'should fire textarea.change when switching to the markdown mode', done => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const markdownEditor = new MarkdownEditor( editor );

				GitHubPage.domManipulator.addEventListener( markdownEditor.dom.textarea, 'change', () => done() );

				editor.setMode( Editor.modes.MARKDOWN );
			} );

			it( 'should not fire textarea.change when switching to rte mode', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const markdownEditor = new MarkdownEditor( editor );

				editor.setMode( Editor.modes.MARKDOWN );

				GitHubPage.domManipulator.addEventListener( markdownEditor.dom.textarea, 'change', () => {
					expect.fail( 'Event should not be fired.' );
				} );

				editor.setMode( Editor.modes.RTE );
			} );
		} );

		describe( 'getData()', () => {
			it( 'should get the value from the textarea', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const markdownEditor = new MarkdownEditor( editor );

				markdownEditor.dom.textarea.value = 'Test';

				expect( markdownEditor.getData() ).to.equals( 'Test' );
			} );
		} );

		describe( 'setData()', () => {
			it( 'should set the value in the textarea', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const markdownEditor = new MarkdownEditor( editor );

				markdownEditor.setData( 'Test' );

				expect( markdownEditor.dom.textarea.value ).to.equals( 'Test' );
			} );

			it( 'should not reset the default value by default', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const markdownEditor = new MarkdownEditor( editor );

				markdownEditor.setData( 'Test' );

				expect( markdownEditor.dom.textarea.defaultValue ).to.equals( '' );
			} );

			it( 'should allow to reset the default value', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const markdownEditor = new MarkdownEditor( editor );

				markdownEditor.setData( 'Test', true );

				expect( markdownEditor.dom.textarea.value ).to.equals( 'Test' );
				expect( markdownEditor.dom.textarea.defaultValue ).to.equals( 'Test' );
			} );
		} );
	} );
} );
