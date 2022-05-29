/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import QuoteSelection from '../../../src/app/plugins/quoteselection';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import BlockQuoteEditing from '@ckeditor/ckeditor5-block-quote/src/blockquoteediting';
import HorizontalLineEditing from '@ckeditor/ckeditor5-horizontal-line/src/horizontallineediting';

import NewCommentEditor from '../../../src/app/features/newcommenteditor';
import Editor from '../../../src/app/editor/editor';

import CKEditorConfig from '../../../src/app/editor/ckeditorconfig';
import EditorExtras from '../../../src/app/plugins/editorextras';
import LiveModelData from '../../../src/app/plugins/livemodeldata';
import ShiftEnter from '@ckeditor/ckeditor5-enter/src/shiftenter';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';

import { createTestEditor } from '../../_util/ckeditor';
import { getData, setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { GitHubPage } from '../../_util/githubpage';

describe( 'Plugins', () => {
	describe( 'QuoteSelection', () => {
		let editor, model;

		{
			beforeEach( 'create test editor', () => {
				return createTestEditor( '', [ QuoteSelection, HorizontalLineEditing ] )
					.then( editorObjects => ( { editor, model } = editorObjects ) );
			} );

			beforeEach( () => {
				// This one is hard to test... and break tests hard.
				sinon.stub( QuoteSelection, 'scrollToSelection' );
			} );

			afterEach( 'cleanup test editor', () => {
				editor.destroy();
			} );
		}

		it( 'should require plugins', () => {
			expect( QuoteSelection.requires ).to.include.members( [ Paragraph, BlockQuoteEditing ] );
		} );

		it( 'should quote', () => {
			editor.quoteSelection( 'test' );

			expect( getData( model ) ).to.equals(
				'<blockQuote><paragraph>test</paragraph></blockQuote>' +
				'<paragraph>[]</paragraph>' );
		} );

		it( 'should trim the last empty paragraph', () => {
			setData( model,
				'<paragraph>Existing content</paragraph>' +
				'<paragraph>[]</paragraph>' );

			editor.quoteSelection( 'test' );

			expect( getData( model ) ).to.equals(
				'<paragraph>Existing content</paragraph>' +
				'<blockQuote><paragraph>test</paragraph></blockQuote>' +
				'<paragraph>[]</paragraph>' );
		} );

		it( 'should not trim the last non-empty paragraph', () => {
			setData( model,
				'<paragraph>Existing content</paragraph>' +
				'<paragraph>Last paragraph[]</paragraph>' );

			editor.quoteSelection( 'test' );

			expect( getData( model ) ).to.equals(
				'<paragraph>Existing content</paragraph>' +
				'<paragraph>Last paragraph</paragraph>' +
				'<blockQuote><paragraph>test</paragraph></blockQuote>' +
				'<paragraph>[]</paragraph>' );
		} );

		it( 'should not trim the last empty non-paragraph', () => {
			setData( model,
				'<paragraph>Existing content[]</paragraph>' +
				'<horizontalLine></horizontalLine>' );

			editor.quoteSelection( 'test' );

			expect( getData( model ) ).to.equals(
				'<paragraph>Existing content</paragraph>' +
				'<horizontalLine></horizontalLine>' +
				'<blockQuote><paragraph>test</paragraph></blockQuote>' +
				'<paragraph>[]</paragraph>' );
		} );

		it( 'should scroll to selection', () => {
			editor.quoteSelection( 'test' );

			expect( QuoteSelection.scrollToSelection.callCount ).to.equals( 1 );
		} );

		describe( 'native event handling', () => {
			beforeEach( () => {
				CKEditorConfig.get.returns( {
					plugins: [ EditorExtras, LiveModelData, Paragraph, ShiftEnter, Bold, Italic, QuoteSelection ]
				} );
			} );

			it( 'should fire a new event after native event', done => {
				const container = GitHubPage.appendElementHtml( '<div></div>' );

				const root = GitHubPage.appendRoot( { type: 'comment', target: container } );

				const editor = new NewCommentEditor( root );
				editor.create()
					.catch( failOnCatch )
					.then( () => {
						GitHubPage.domManipulator.addEventListener( window, 'message', event => {
							expect( event.data.type ).to.equals( 'GitHub-Writer-Quote-Selection' );
							expect( event.data.text ).to.equals( 'test' );
							expect( event.data.id ).to.equals( editor.id );
							done();
						} );

						container.dispatchEvent( new CustomEvent( 'quote-selection', {
							bubbles: true,
							detail: {
								selectionText: 'test'
							}
						} ) );
					} );
			} );

			it( 'should send the event data to ckeditor', done => {
				const container = GitHubPage.appendElementHtml( '<div></div>' );
				const root = GitHubPage.appendRoot( { type: 'comment', target: container } );

				const editor = new NewCommentEditor( root );
				editor.create()
					.catch( failOnCatch )
					.then( () => {
						const stub = sinon.stub( editor.ckeditor, 'quoteSelection' );

						stub.callsFake( text => {
							expect( text ).to.equals( 'test' );
							done();
						} );

						container.dispatchEvent( new CustomEvent( 'quote-selection', {
							bubbles: true,
							detail: {
								selectionText: 'test'
							}
						} ) );
					} );
			} );

			it( 'should do nothing on empty text', done => {
				const container = GitHubPage.appendElementHtml( '<div></div>' );
				const root = GitHubPage.appendRoot( { type: 'comment', target: container } );

				const editor = new NewCommentEditor( root );
				editor.create()
					.catch( failOnCatch )
					.then( () => {
						const spy = sinon.spy( Editor, 'createEditor' );

						container.dispatchEvent( new CustomEvent( 'quote-selection', {
							bubbles: true,
							detail: {
								selectionText: ''
							}
						} ) );

						setTimeout( () => {
							expect( spy.notCalled ).to.be.true;
							done();
						}, 0 );
					} );
			} );

			it( 'should do nothing if not in rte mode', done => {
				const container = GitHubPage.appendElementHtml( '<div></div>' );
				const root = GitHubPage.appendRoot( { type: 'comment', target: container } );

				const editor = new NewCommentEditor( root );
				editor.create()
					.catch( failOnCatch )
					.then( () => {
						editor.setMode( Editor.modes.MARKDOWN );

						const spy = sinon.spy( editor.ckeditor, 'quoteSelection' );

						container.dispatchEvent( new CustomEvent( 'quote-selection', {
							bubbles: true,
							detail: {
								selectionText: 'test'
							}
						} ) );

						setTimeout( () => {
							expect( spy.notCalled ).to.be.true;
							done();
						}, 0 );
					} );
			} );

			it( 'should do nothing with wrong root match', done => {
				const container = GitHubPage.appendElementHtml( '<div></div>' );
				const root = GitHubPage.appendRoot( { type: 'comment' } );

				const editor = new NewCommentEditor( root );
				editor.create()
					.catch( failOnCatch )
					.then( () => {
						// Dirty it up with a editor like form which has no editor.
						container.innerHTML = '<form class="js-inline-comment-form"></form>';

						const spy = sinon.spy( Editor, 'createEditor' );

						container.dispatchEvent( new CustomEvent( 'quote-selection', {
							bubbles: true,
							detail: {
								selectionText: 'test'
							}
						} ) );

						setTimeout( () => {
							expect( spy.callCount ).to.equals( 0 );
							done();
						} );
					} );
			} );
		} );
	} );
} );

function failOnCatch( err ) {
	expect.fail( err.message + '\n' + err.stack );
}
