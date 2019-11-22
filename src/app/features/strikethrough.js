/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Feature from '../feature';
import icon from '@ckeditor/ckeditor5-basic-styles/theme/icons/strikethrough.svg';

export default class Strikethrough extends Feature {
	constructor( editor ) {
		super( 'strikethrough', editor );
		this.kebab = true;
		this.icon = icon;
	}
}
