/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../../../src/app/editor/editor';
import { DomManipulator, PageIncompatibilityError } from '../../../src/app/modules/util';

import { GitHubPage } from '../../_util/githubpage';

describe( 'Editor', () => {
	describe( 'Editor', () => {
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

			it( 'should find the preview tab when in comment edit', () => {
				const root = GitHubPage.appendRoot( { type: 'comment-edit' } );
				const editor = new Editor( root );

				expect( editor ).to.have.property( 'dom' );
				expect( editor.dom.panels.preview ).to.be.an.instanceOf( HTMLElement );
			} );

			it( 'should throw error is there is no tabs', () => {
				GitHubPage.setPageName( 'repo_releases' );

				const root = GitHubPage.appendRoot( { type: 'release' } );
				root.querySelector( '.tabnav-tabs' ).classList.remove( 'tabnav-tabs' );

				expect( () => new Editor( root ) ).to.throw( PageIncompatibilityError );
			} );

			it( 'should set isEdit to false when not edit', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				expect( editor.dom.isEdit ).to.be.false;
			} );

			it( 'should set isEdit to true when edit', () => {
				const editor = new Editor( GitHubPage.appendRoot( { type: 'comment-edit' } ) );

				expect( editor.dom.isEdit ).to.be.true;
			} );

			it( 'should add the editor type class', () => {
				class TestEditor extends Editor {
					get type() {
						return 'Test';
					}
				}

				const editor = new TestEditor( GitHubPage.appendRoot() );

				expect( editor.dom.root.classList.contains( 'github-writer-test' ) ).to.be.true;
			} );

			it( 'should add css classes to the panel elements', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				expect( editor.dom.panels.markdown.classList.contains( 'github-writer-panel-markdown' ) ).to.be.true;
				expect( editor.dom.panels.preview.classList.contains( 'github-writer-panel-preview' ) ).to.be.true;
			} );
		} );

		describe( 'focus()', () => {
			it( 'should set focus into ckeditor', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				return editor.create()
					.then( () => {
						const spy = sinon.spy( editor.ckeditor, 'focus' );
						editor.focus();
						expect( spy.callCount ).to.equals( 1 );
					} );
			} );

			it( 'should do nothing before ckeditor creation', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				expect( () => editor.focus() ).to.not.throw();
			} );
		} );

		it( 'should not throw if no submit button', () => {
			const root = GitHubPage.appendRoot();
			root.querySelector( '.btn-primary' ).remove();
			const editor = new Editor( root );

			let promise;

			expect( () => ( promise = editor.create() ) ).to.not.throw();

			// noinspection JSUnusedAssignment
			return promise
				.then( editor => {
					expect( editor ).be.an.instanceOf( Editor );
				} )
				.catch( () => expect.fail() );
		} );
	} );
} );
