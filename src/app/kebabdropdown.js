/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { addToolbarToDropdown, createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';

import kebabIcon from './icons/kebab.svg';

export default class KebabDropdown {
	constructor( editor ) {
		this.view = createDropdown( editor.editor.locale );
		this.view.panelPosition = 'sw';

		this.view.buttonView.set( {
			icon: kebabIcon,
			class: 'github-rte-kebab-button toolbar-item tooltipped tooltipped-n'
		} );

		this.buttons = [];
	}

	getElement() {
		// Create a dropdown with a toolbar inside the panel.
		addToolbarToDropdown( this.view, this.buttons );

		this.view.render();
		this.view.buttonView.element.setAttribute( 'aria-label', 'More options...' );
		return this.view.element;
	}
}

