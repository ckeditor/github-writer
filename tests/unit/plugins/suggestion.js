/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Suggestion from '../../../src/app/plugins/suggestion';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import Editor from '../../../src/app/editor';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import CodeBlock from '@ckeditor/ckeditor5-code-block/src/codeblock';
import QuoteSelection from '../../../src/app/plugins/quoteselection';
import HorizontalLineEditing from '@ckeditor/ckeditor5-horizontal-line/src/horizontallineediting';

import RteEditorConfig from '../../../src/app/editors/rteeditorconfig';

import { getData, setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { GitHubPage } from '../../_util/githubpage';

import icon from '../../../src/app/icons/suggestion.svg';

describe( 'Plugins', () => {
	describe( 'Suggestion', () => {
		let editor, model, button;

		{
			beforeEach( 'create test editor', () => {
				sinon.stub( RteEditorConfig, 'get' ).returns( { plugins: [ Paragraph, Suggestion, HorizontalLineEditing ] } );

				const root = GitHubPage.appendRoot();
				root.querySelector( 'markdown-toolbar' ).insertAdjacentHTML( 'afterbegin',
					'<button class="js-suggested-change-toolbar-item" data-lines="code">Suggest</button>' );

				editor = new Editor( root );

				return editor.create()
					.then( editor => {
						model = editor.rteEditor.ckeditor.model;
						button = editor.rteEditor.ckeditor.ui.componentFactory.create( 'suggestion' );
					} );
			} );

			beforeEach( () => {
				// This one is hard to test... and break tests hard.
				sinon.stub( QuoteSelection, 'scrollToSelection' );
			} );
		}

		it( 'should require plugins', () => {
			expect( Suggestion.requires ).to.include.members( [ CodeBlock, QuoteSelection ] );
		} );

		it( 'should register the ui component', () => {
			expect( button ).to.be.an.instanceOf( ButtonView );
		} );

		it( 'button should have a label', () => {
			expect( button.label ).to.be.a( 'string' );
		} );

		it( 'button should have the right icon', () => {
			expect( button.icon ).to.equals( icon );
		} );

		it( 'should have tooltip', () => {
			expect( button.tooltip ).to.be.true;
		} );

		describe( 'execute', () => {
			it( 'should quote', () => {
				button.fire( 'execute' );

				expect( getData( model ) ).to.equals(
					'<codeBlock language="suggestion">code[]</codeBlock>' +
					'<paragraph></paragraph>' );
			} );

			it( 'should trim the last empty paragraph', () => {
				setData( model,
					'<paragraph>Existing content</paragraph>' +
					'<paragraph>[]</paragraph>' );

				button.fire( 'execute' );

				expect( getData( model ) ).to.equals(
					'<paragraph>Existing content</paragraph>' +
					'<codeBlock language="suggestion">code[]</codeBlock>' +
					'<paragraph></paragraph>' );
			} );

			it( 'should not trim the last non-empty paragraph', () => {
				setData( model,
					'<paragraph>Existing content</paragraph>' +
					'<paragraph>Last paragraph[]</paragraph>' );

				button.fire( 'execute' );

				expect( getData( model ) ).to.equals(
					'<paragraph>Existing content</paragraph>' +
					'<paragraph>Last paragraph</paragraph>' +
					'<codeBlock language="suggestion">code[]</codeBlock>' +
					'<paragraph></paragraph>' );
			} );

			it( 'should not trim the last empty non-paragraph', () => {
				setData( model,
					'<paragraph>Existing content[]</paragraph>' +
					'<horizontalLine></horizontalLine>' );

				button.fire( 'execute' );

				expect( getData( model ) ).to.equals(
					'<paragraph>Existing content</paragraph>' +
					'<horizontalLine></horizontalLine>' +
					'<codeBlock language="suggestion">code[]</codeBlock>' +
					'<paragraph></paragraph>' );
			} );

			it( 'should scroll to selection', () => {
				button.fire( 'execute' );

				expect( QuoteSelection.scrollToSelection.callCount ).to.equals( 1 );
			} );
		} );
	} );
} );
