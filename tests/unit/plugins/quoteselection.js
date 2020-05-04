/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import QuoteSelection from '../../../src/app/plugins/quoteselection';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import BlockQuoteEditing from '@ckeditor/ckeditor5-block-quote/src/blockquoteediting';
import HorizontalLineEditing from '@ckeditor/ckeditor5-horizontal-line/src/horizontallineediting';

import { createTestEditor } from '../../_util/ckeditor';
import { getData, setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';

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
	} );
} );
