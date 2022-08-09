/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../editor/editor';

export default class ReviewEditor extends Editor {
	get type() {
		return 'ReviewEditor';
	}

	static run() {
		return this.createEditor( 'div.js-reviews-container form' );
	}
}
