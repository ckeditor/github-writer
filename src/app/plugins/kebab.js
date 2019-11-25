/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { addToolbarToDropdown, createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import normalizeToolbarConfig from '@ckeditor/ckeditor5-ui/src/toolbar/normalizetoolbarconfig';
import kebabIcon from '../icons/kebab.svg';

export default class Kebab extends Plugin {
	init() {
		const editor = this.editor;

		// Register the 'kebab' component, a dropdown.
		editor.ui.componentFactory.add( 'kebab', locale => {
			const dropdown = createDropdown( locale );

			dropdown.panelPosition = 'sw';

			dropdown.buttonView.set( {
				label: 'More options...',
				icon: kebabIcon,
				class: 'github-rte-kebab-button toolbar-item tooltipped tooltipped-n'
			} );

			// Initializes the 'toolbarView' property of the dropdown.
			addToolbarToDropdown( dropdown, [] );

			// Fill the toolbar with the configured items.
			const toolbarConfig = normalizeToolbarConfig( editor.config.get( 'kebabToolbar' ) );
			dropdown.toolbarView.fillFromConfig( toolbarConfig.items, editor.ui.componentFactory );

			return dropdown;
		} );
	}
}
