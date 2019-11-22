/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Feature from '../feature';
import icon from '@ckeditor/ckeditor5-horizontal-line/theme/icons/horizontalline.svg';

export default class HorizontalLine extends Feature {
	constructor( editor ) {
		super( 'horizontalline', editor, {
			command: 'horizontalLine',
			text: 'Add horizontal rule',
			kebab: true,
			icon
		} );
	}
}
