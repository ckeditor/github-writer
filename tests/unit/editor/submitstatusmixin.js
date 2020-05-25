/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../../../src/app/editor/editor';
import WikiEditor from '../../../src/app/features/wikieditor';

import CKEditorConfig from '../../../src/app/editor/ckeditorconfig';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import EditorExtras from '../../../src/app/plugins/editorextras';
import PendingActions from '@ckeditor/ckeditor5-core/src/pendingactions';

import { GitHubPage } from '../../_util/githubpage';
import { createElementFromHtml } from '../../../src/app/modules/util';

describe( 'Editor', () => {
	describe( 'SubmitStatusMixin', () => {
		beforeEach( () => {
			CKEditorConfig.get.returns( { plugins: [ Paragraph, EditorExtras, PendingActions ] } );
		} );

		it( 'should react to the editor emptiness', () => {
			const editor = new Editor( GitHubPage.appendRoot() );

			return editor.create()
				.then( () => {
					expect( editor.dom.getSubmitBtn().disabled ).to.be.true;

					editor.setData( 'Test' );
					expect( editor.dom.getSubmitBtn().disabled ).to.be.false;

					editor.setData( '' );
					expect( editor.dom.getSubmitBtn().disabled ).to.be.true;
				} );
		} );

		it( 'should check other required elements (empty)', () => {
			const editor = new Editor( GitHubPage.appendRoot( { text: 'Test' } ) );
			const other = createElementFromHtml( '<input class="test-el" value="" required>' );
			editor.dom.root.insertAdjacentElement( 'afterbegin', other );

			return editor.create()
				.then( () => {
					expect( editor.dom.getSubmitBtn().disabled ).to.be.true;

					other.value = 'Something';
					editor.ckeditor.fire( 'change:isEmpty' );
					expect( editor.dom.getSubmitBtn().disabled ).to.be.false;

					editor.setData( '' );
					expect( editor.dom.getSubmitBtn().disabled ).to.be.true;
				} );
		} );

		it( 'should check other required elements (filled)', () => {
			const editor = new Editor( GitHubPage.appendRoot( { text: 'Test' } ) );
			editor.dom.root.insertAdjacentHTML( 'afterbegin', '<input value="Test" required>' );

			return editor.create()
				.then( () => {
					expect( editor.dom.getSubmitBtn().disabled ).to.be.false;
				} );
		} );

		it( 'should not check other required elements in wiki', () => {
			GitHubPage.reset();
			GitHubPage.setPageName( 'repo_wiki' );

			const editor = new WikiEditor( GitHubPage.appendRoot( { type: 'wiki', text: 'Test' } ) );
			editor.dom.root.insertAdjacentHTML( 'afterbegin', '<input value="" required>' );

			return editor.create()
				.then( () => {
					expect( editor.dom.getSubmitBtn().disabled ).to.be.false;
				} );
		} );

		it( 'should control the submit button in the code editor', () => {
			const editor = new Editor( GitHubPage.appendRoot() );
			const codeSubmit = GitHubPage.appendElementHtml(
				'<button type="submit" class="btn-primary js-blob-submit">Submit</button>' );

			editor.dom.root.append( codeSubmit );

			return editor.create()
				.then( () => {
					expect( codeSubmit.disabled ).to.be.true;

					editor.setData( 'Test' );
					expect( codeSubmit.disabled ).to.be.false;

					editor.setData( '' );
					expect( codeSubmit.disabled ).to.be.true;
				} );
		} );

		it( 'should react to pending actions', () => {
			const editor = new Editor( GitHubPage.appendRoot( { text: 'Test' } ) );

			return editor.create()
				.then( () => {
					const pendingActions = editor.ckeditor.plugins.get( 'PendingActions' );

					expect( editor.dom.getSubmitBtn().disabled ).to.be.false;

					const action = pendingActions.add( 'Testing' );
					expect( editor.dom.getSubmitBtn().disabled ).to.be.true;

					pendingActions.remove( action );
					expect( editor.dom.getSubmitBtn().disabled ).to.be.false;
				} );
		} );

		it( 'should do nothing if not RTE mode', () => {
			const editor = new Editor( GitHubPage.appendRoot() );

			return editor.create()
				.then( () => {
					expect( editor.dom.getSubmitBtn().disabled ).to.be.true;

					editor.setMode( Editor.modes.MARKDOWN );

					editor.setCKEditorData( 'Test' );
					expect( editor.dom.getSubmitBtn().disabled ).to.be.true;
				} );
		} );

		it( 'should observe external changes to submit.disabled', done => {
			// The root textarea has "required".
			const editor = new Editor( GitHubPage.appendRoot() );
			const otherInput = createElementFromHtml( '<input class="test-el" value="" required>' );
			editor.dom.root.insertAdjacentElement( 'afterbegin', otherInput );

			editor.create()
				.then( () => {
					expect( editor.dom.getSubmitBtn().disabled, 'disabled start' ).to.be.true;

					otherInput.value = 'Testing';
					editor.dom.getSubmitBtn().disabled = false;

					// Mutation observers are asynchronous, so we should still not see the editor fixup here.
					expect( editor.dom.getSubmitBtn().disabled, 'disabled after mutation' ).to.be.false;

					// So we use a timout to give a chance to the observer to be invoked.
					setTimeout( () => {
						expect( editor.dom.getSubmitBtn().disabled, 'not disabled after mutation' ).to.be.true;

						otherInput.value = '';
						editor.dom.getSubmitBtn().disabled = true;

						setTimeout( () => {
							expect( editor.dom.getSubmitBtn().disabled, 'stay disabled' ).to.be.true;
							done();
						} );
					} );
				} );
		} );
	} );
} );
