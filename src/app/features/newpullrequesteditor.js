/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../editor/editor';

export default class NewPullRequestEditor extends Editor {
	get type() {
		return 'NewPullRequestEditor';
	}

	static run() {
		return this.createEditor( 'form#new_pull_request' );
	}
}
