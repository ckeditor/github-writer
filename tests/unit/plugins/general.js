/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import General from '../../../src/app/plugins/general';
import TableEditing from '@ckeditor/ckeditor5-table/src/tableediting';

import { createTestEditor } from '../../_util/ckeditor';
import { getData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';

describe( 'Plugins', () => {
	describe( 'General', () => {
		describe( '_fixInsertTableCommand', () => {
			it( 'should default table insertion to have a header row', () => {
				return createTestEditor( '', [ TableEditing, General ] )
					.then( ( { editor, model } ) => {
						editor.execute( 'insertTable', { rows: 2, columns: 2 } );

						expect( getData( model ) ).to.equal(
							'<table headingRows="1">' +
							'<tableRow><tableCell><paragraph>[]</paragraph></tableCell>' +
							'<tableCell><paragraph></paragraph></tableCell></tableRow>' +
							'<tableRow><tableCell><paragraph></paragraph></tableCell>' +
							'<tableCell><paragraph></paragraph></tableCell></tableRow>' +
							'</table>' );
					} );
			} );

			it( 'should not throw if insertTable is not present', () => {
				return createTestEditor( '', [ General ] )
					.then( ( { editor } ) => {
						expect( editor.plugins.get( General ) ).to.be.an.instanceOf( General );
					} );
			} );
		} );
	} );
} );
