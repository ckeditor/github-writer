/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { addToolbarToDropdown, createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import kebabIcon from './icons/kebab.svg';
import strikethroughIcon from '@ckeditor/ckeditor5-basic-styles/theme/icons/strikethrough.svg';

export default function createKebab( locale ) {
	const dropdownView = createDropdown( locale );

	dropdownView.buttonView.set( {
		icon: kebabIcon,
		class: 'github-rte-kebab-button toolbar-item tooltipped tooltipped-n'
	} );

	const buttons = [];

	const strikethroughButton = new ButtonView();
	strikethroughButton.set( {
		// withText: true,
		label: 'Strike',
		icon: strikethroughIcon
	} );

	// Add a simple button to the array of toolbar items.
	buttons.push( strikethroughButton );

	// Create a dropdown with a toolbar inside the panel.
	addToolbarToDropdown( dropdownView, buttons );

	dropdownView.render();

	dropdownView.buttonView.element.setAttribute( 'aria-label', 'More options...' );

	return dropdownView.element;
}
