/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../editor/editor';

export default class NewIssueEditor extends Editor {
	get type() {
		return 'NewIssueEditor';
	}

	static run() {
		return this.createEditor( 'form#new_issue' );
	}
}
