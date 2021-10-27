/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Emoji from '../../../src/app/plugins/emoji';

import Clipboard from '@ckeditor/ckeditor5-clipboard/src/clipboard';
import ImageInlineEditing from '@ckeditor/ckeditor5-image/src/image/imageinlineediting';
import ImageBlockEditing from '@ckeditor/ckeditor5-image/src/image/imageblockediting';

import { createTestEditor } from '../../_util/ckeditor';
import { getData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { getData as getViewData } from '@ckeditor/ckeditor5-engine/src/dev-utils/view';

describe( 'Plugins', () => {
	describe( 'Emoji', () => {
		let editor, editable, model, root;

		{
			beforeEach( 'create test editor', () => {
				return createTestEditor( '', [ Emoji, Clipboard, ImageInlineEditing, ImageBlockEditing ] )
					.then( editorObjects => ( { editor, model, root } = editorObjects ) )
					.then( () => {
						editable = editor.ui.getEditableElement();
						document.body.appendChild( editable );
					} );
			} );

			afterEach( 'cleanup test editor', () => {
				editable.remove();
				return editor.destroy();
			} );
		}

		it( 'should be defined as isInline and isObject', () => {
			const data = ':smiley:';
			editor.setData( data );

			const emoji = root.getNodeByPath( [ 0, 0 ] );

			expect( model.schema.isInline( emoji ) ).to.be.true;
			expect( model.schema.isObject( emoji ) ).to.be.true;
		} );

		it( 'should fix mapping inside emoji', () => {
			const data = ':smiley:';
			editor.setData( data );

			const emoji = editor.editing.view.document.getRoot().getChild( 0 ).getChild( 0 );

			const viewPosition = editor.editing.view.createPositionAt( emoji, 0 );
			expect( viewPosition.parent ).to.equal( emoji );

			// This should transform [ 0, 0, 0 ] => [ 0, 0 ].
			const modelPosition = editor.editing.mapper.toModelPosition( viewPosition );
			expect( modelPosition.path ).to.eql( [ 0, 0 ] );
		} );

		describe( 'downcast', () => {
			it( 'should change text to emoji', () => {
				const data = 'Test :smiley: test';
				editor.setData( data );

				expect( getData( model ) ).to.equal(
					'<paragraph>[]Test <emoji name="smiley"></emoji> test</paragraph>' );
				expect( getViewData( editor.editing.view ) ).to.equals(
					'<p>{}Test <g-emoji alias="smiley" contenteditable="false">😃</g-emoji> test</p>' );
				expect( editor.getData().replace( /\u00a0/g, ' ' ) ).to.equals( data );
			} );

			it( 'should change text to emoji (non-unicode)', () => {
				const data = 'Test :octocat: test';
				editor.setData( data );

				expect( getData( model ) ).to.equal(
					'<paragraph>[]Test <emoji name="octocat"></emoji> test</paragraph>' );
				expect( getViewData( editor.editing.view ) ).to.equals(
					'<p>{}Test <g-emoji alias="octocat" contenteditable="false">' +
					'<img align="absmiddle" alt=":octocat:" class="emoji" height="20"' +
					' src="https://github.githubassets.com/images/icons/emoji/octocat.png" width="20"></img>' +
					'</g-emoji> test</p>' );
				expect( editor.getData().replace( /\u00a0/g, ' ' ) ).to.equals( data );
			} );

			it( 'should work when data is just the emoji', () => {
				const data = ':smiley:';
				editor.setData( data );

				expect( getData( model ) ).to.equal(
					'<paragraph>[]<emoji name="smiley"></emoji></paragraph>' );
				expect( getViewData( editor.editing.view ) ).to.equals(
					'<p>[]<g-emoji alias="smiley" contenteditable="false">😃</g-emoji></p>' );
				expect( editor.getData().replace( /\u00a0/g, ' ' ) ).to.equals( data );
			} );

			it( 'should do nothing if text is an unknown emoji', () => {
				const data = ':testtest:';
				editor.setData( data );

				expect( getData( model ) ).to.equal(
					'<paragraph>[]:testtest:</paragraph>' );
				expect( getViewData( editor.editing.view ) ).to.equals(
					'<p>{}:testtest:</p>' );
				expect( editor.getData().replace( /\u00a0/g, ' ' ) ).to.equals( data );
			} );
		} );

		describe( 'upcast', () => {
			it( 'should upcast <g-emoji>', () => {
				pasteHtml( editor, '<p><g-emoji alias="smiley">😃</g-emoji></p>' );

				expect( getData( model ) ).to.equal(
					'<paragraph><emoji name="smiley"></emoji>[]</paragraph>' );
				expect( getViewData( editor.editing.view ) ).to.equals(
					'<p><g-emoji alias="smiley" contenteditable="false">😃</g-emoji>[]</p>' );
				expect( editor.getData().replace( /\u00a0/g, ' ' ) ).to.equals( ':smiley:' );
			} );

			it( 'should upcast <img>', () => {
				pasteHtml( editor, '<p><img class="emoji" alt=":octocat:" src="emoji"></p>' );

				expect( getData( model ) ).to.equal(
					'<paragraph><emoji name="octocat"></emoji>[]</paragraph>' );
				expect( getViewData( editor.editing.view ) ).to.equals(
					'<p><g-emoji alias="octocat" contenteditable="false">' +
					'<img align="absmiddle" alt=":octocat:" class="emoji" height="20"' +
					' src="https://github.githubassets.com/images/icons/emoji/octocat.png" width="20"></img>' +
					'</g-emoji>[]</p>' );
				expect( editor.getData().replace( /\u00a0/g, ' ' ) ).to.equals( ':octocat:' );
			} );

			it( 'should not upcast <img> which is not emoji', () => {
				pasteHtml( editor, '<p><img alt=":octocat:" src="image-url"></p>' );

				expect( getData( model ) ).to.equal(
					'<paragraph><imageInline alt=":octocat:" src="image-url"></imageInline>[]</paragraph>' );
				expect( getViewData( editor.editing.view ) ).to.equals(
					'<p><span class="ck-widget image-inline" contenteditable="false">' +
					'<img alt=":octocat:" src="image-url"></img>' +
					'</span>[]</p>' );
				expect( editor.getData().replace( /\u00a0/g, ' ' ) ).to.equals( '![:octocat:](image-url)' );
			} );

			it( 'should not upcast <img> which has no valid emoji', () => {
				pasteHtml( editor, '<p><img class="emoji" alt=":testtest:" src="image-url"></p>' );

				expect( getData( model ) ).to.equal(
					'<paragraph><imageInline alt=":testtest:" src="image-url"></imageInline>[]</paragraph>' );
				expect( getViewData( editor.editing.view ) ).to.equals(
					'<p><span class="ck-widget image-inline" contenteditable="false">' +
					'<img alt=":testtest:" src="image-url"></img>' +
					'</span>[]</p>' );
				expect( editor.getData().replace( /\u00a0/g, ' ' ) ).to.equals( '![:testtest:](image-url)' );
			} );

			it( 'should ignore upcast of <img> inside <g-emoji>', () => {
				pasteHtml( editor, '<p><g-emoji alias="smiley"><img class="emoji" alt=":octocat:" src="emoji"></g-emoji></p>' );

				expect( getData( model ) ).to.equal(
					'<paragraph><emoji name="smiley"></emoji>[]</paragraph>' );
				expect( getViewData( editor.editing.view ) ).to.equals(
					'<p><g-emoji alias="smiley" contenteditable="false">😃</g-emoji>[]</p>' );
				expect( editor.getData().replace( /\u00a0/g, ' ' ) ).to.equals( ':smiley:' );
			} );
		} );

		describe( 'post-fixer', () => {
			it( 'should do nothing if another post-fixer removed the attribute', () => {
				editor.model.document.registerPostFixer( writer => {
					const changes = editor.model.document.differ.getChanges();

					changes.forEach( change => {
						if ( change.type === 'attribute' && change.attributeKey === 'word' &&
							change.attributeNewValue ) {
							const node = change.range.start.nodeAfter;
							writer.removeAttribute( 'word', node );
						}
					} );
				} );

				const data = ':smiley:';
				editor.setData( data );

				expect( getData( model ) ).to.equal( '<paragraph>[]:smiley:</paragraph>' );
			} );
		} );
	} );
} );

function pasteHtml( editor, html ) {
	const data = { 'text/html': html };

	editor.editing.view.document.fire( 'paste', {
		dataTransfer: {
			getData: type => {
				return data[ type ];
			}
		},
		preventDefault: () => {
		},
		stopPropagation: () => {
		}
	} );
}
