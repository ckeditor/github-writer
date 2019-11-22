/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../editor';
import Feature from '../feature';
import icon from '../icons/markdown.svg';

export default class Markdown extends Feature {
	constructor( editor ) {
		super( 'markdown', editor, {
			text: 'View markdown (nostalgia)',
			kebab: true,
			icon
		} );
	}

	execute() {
		this.editor.mode = this.editor.mode === Editor.modes.RTE ? Editor.modes.MARKDOWN : Editor.modes.RTE;
	}
}
