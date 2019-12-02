/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import RteEditor from './rteeditor';

export default class WikiRteEditor extends RteEditor {
	injectToolbar( toolbarElement ) {
		// Inject the rte toolbar at the end of the toolbar container.
		this.githubEditor.markdownEditor.dom.toolbarContainer.appendChild( toolbarElement );
	}

	getEditableParentTree() {
		return `
			<div class="github-rte-panel-rte">
				<div class="github-rte-ckeditor upload-enabled form-control markdown-body"></div>
			</div>
		`;
	}
}
