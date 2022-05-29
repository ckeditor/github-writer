/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import CKEditorGitHubEditor from '../../src/app/editor/ckeditorgithubeditor';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import ShiftEnter from '@ckeditor/ckeditor5-enter/src/shiftenter';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';

export function createTestEditor( initialData, extraPlugins, extraConfig ) {
	let plugins = [ Paragraph, ShiftEnter, Bold, Italic ];
	extraPlugins && ( plugins = plugins.concat( extraPlugins ) );

	const config = { plugins };
	extraConfig && Object.assign( config, extraConfig );

	return CKEditorGitHubEditor.create( initialData || '', config )
		.then( editor => {
			editor.fire( 'reallyReady' );
			return {
				editor,
				model: editor.model,
				root: editor.model.document.getRoot()
			};
		} );
}

export function getDataRange( editor, data ) {
	const start = data.indexOf( '[' );
	data = data.replace( '[', '' );

	const end = data.indexOf( ']' );
	data = data.replace( ']', '' );

	editor.setData( data );

	const model = editor.model;
	const root = model.document.getRoot();

	return model.createRange(
		model.createPositionFromPath( root, [ 0, start ] ),
		model.createPositionFromPath( root, [ 0, end ] )
	);
}

export function getDataPosition( editor, data ) {
	const offset = data.indexOf( '|' );
	data = data.replace( '|', '' );

	editor.setData( data );

	expect( editor.getData() ).to.equal( data );

	const model = editor.model;
	const root = model.document.getRoot();

	return model.createPositionFromPath( root, [ 0, offset ] );
}

export const fakeLocale = {
	t() {
	}
};
