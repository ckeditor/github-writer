/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import RteEditor from './rteeditor';

/**
 * The rte editor, with CKEditor 5 under the hood, used in the wiki pages.
 */
export default class WikiRteEditor extends RteEditor {
	/**
	 * @inheritDoc
	 */
	injectToolbar( toolbarElement ) {
		// Inject the rte toolbar at the end of the toolbar container.
		this.githubEditor.domManipulator.append( this.githubEditor.markdownEditor.dom.toolbarContainer, toolbarElement );
	}

	/**
	 * @inheritDoc
	 */
	getEditableParentTree() {
		// Mimic the minimum set of classes that are necessary for the editor, and its contents,
		// to look like GitHub originals.
		return `
			<div class="github-writer-panel-rte">
				<div class="github-writer-ckeditor upload-enabled form-control markdown-body"></div>
			</div>
		`;
	}
}
