/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import CodeBlockEditing from '@ckeditor/ckeditor5-code-block/src/codeblockediting';
import KbdEditing from '@mlewand/ckeditor5-keyboard-marker/src/KbdEditing';
import ListEditing from '@ckeditor/ckeditor5-list/src/list/listediting';
import TodoListEditing from '@ckeditor/ckeditor5-list/src/todolist/todolistediting';

import { createTestEditor } from '../../_util/ckeditor';
import { getData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';

describe( 'Dependencies', () => {
	describe( 'ckeditor5-markdown-gfm', () => {
		let editor, model;

		{
			before( 'create test editor', () => {
				return createTestEditor( '', [ CodeBlockEditing, KbdEditing, ListEditing, TodoListEditing ] )
					.then( editorObjects => ( { editor, model } = editorObjects ) );
			} );

			after( 'destroy test editor', () => {
				editor.destroy();
			} );
		}

		it( 'should allow ``` in code blocks', () => {
			const data = '````plaintext\n' +
				'```\n' +
				'Code\n' +
				'```\n' +
				'````';
			editor.setData( data );

			expect( getData( model ) ).to.equal(
				'<codeBlock language="plaintext">' +
				'[]```<softBreak></softBreak>Code<softBreak></softBreak>```' +
				'</codeBlock>' );
			expect( editor.getData() ).to.equal( data );
		} );

		it( 'should no escape urls', () => {
			const data = 'escape\\_this https://test.com/do_[not]-escape escape\\_this';
			editor.setData( data );
			expect( editor.getData() ).to.equal( data );
		} );

		it( 'should not autolink input urls', () => {
			const data = 'Link: http://example.com/.';
			editor.setData( data );
			expect( getData( model ) ).to.equal( '<paragraph>[]Link: http://example.com/.</paragraph>' );
			expect( editor.getData() ).to.equal( data );
		} );

		it( 'should work with todo lists', () => {
			const data =
				'*   [ ] List 1\n' +
				'*   [x] Item 2';
			editor.setData( data );
			expect( editor.getData() ).to.equal( data );
		} );

		it( 'should escape html as text', () => {
			const data =
				'\\<h1>Test\\</h1>';
			editor.setData( data );
			expect( getData( model ) ).to.equal( '<paragraph>[]<h1>Test</h1></paragraph>' );
			expect( editor.getData() ).to.equal( data );
		} );

		it( 'should keep the <kbd> element in the output', () => {
			const data = 'Test <kbd>shortcut</kbd>.';
			editor.setData( data );

			expect( getData( model ) ).to.equal( '<paragraph>[]Test <$text kbd="true">shortcut</$text>.</paragraph>' );
			expect( editor.getData() ).to.equal( data );
		} );
	} );
} );
