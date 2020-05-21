/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
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

			it( 'should root have the editor constructor class', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				expect( editor.dom.root.classList.contains( 'github-writer-editor' ) ).to.be.true;
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
