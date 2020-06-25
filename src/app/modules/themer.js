import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import ToolbarSeparatorView from '@ckeditor/ckeditor5-ui/src/toolbar/toolbarseparatorview';
import DropdownView from '@ckeditor/ckeditor5-ui/src/dropdown/dropdownview';
import SplitButtonView from '@ckeditor/ckeditor5-ui/src/dropdown/button/splitbuttonview';

/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const themer = {
	/**
	 *
	 * @param toolbar {ToolbarView}
	 */
	fixToolbar( toolbar ) {
		toolbar.class = 'toolbar-commenting d-flex no-wrap flex-items-start flex-wrap px-2 pt-2 pt-lg-0 border-md-top border-lg-top-0';

		for ( const item of toolbar.items ) {
			// Some items, like Drop Downs and File Dialog, are containers for their buttons. Take the inner button then.
			if ( item.buttonView ) {
				this.fixToolbarButton( item.buttonView );
			}

			if ( item instanceof ButtonView ) {
				this.fixToolbarButton( item );
			}

			if ( item instanceof DropdownView ) {
				this.fixDropdown( item );
			}

			if ( item instanceof ToolbarSeparatorView ) {
				item.element.classList.add( 'toolbar-item', 'mr-3', 'p-0' );
			}
		}
	},

	/**
	 *
	 * @param button {ButtonView}
	 */
	fixToolbarButton( button ) {
		if ( button instanceof SplitButtonView ) {
			this.fixToolbarButton( button.actionView );
			this.fixToolbarButton( button.arrowView );
		} else {
			appendClasses( button, 'toolbar-item', 'mx-1' );

			const icon = button.element.querySelector( 'svg' );
			icon.setAttribute( 'height', '16' );
			icon.classList.add( 'octicon' );
		}
	},

	/**
	 *
	 * @param dropdown {DropdownView}
	 */
	fixDropdown( dropdown ) {
		const arrow = dropdown.element.querySelector( '.ck-dropdown__arrow, .ck-splitbutton__arrow svg' );
		arrow && arrow.classList.add( 'dropdown-caret' );

		dropdown.panelView.element.classList.add( 'dropdown-menu' );
	}
};

export default themer;

function appendClasses( view, ...classes ) {
	view.class = [ ( view.class || '' ), ...classes ].join( ' ' ).trim();
}
