/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import WordFinder from './wordfinder';

/**
 * Enables auto-linking for urls present in text.
 */
export default class AutoLinkUrl extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ WordFinder ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		// Register a word finder for urls.
		this.editor.wordFinder.add( {
			type: 'url',
			// eslint-disable-next-line max-len
			pattern: /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[A-Z0-9+&@#/%=~_|$])/i,
			callback: match => ( match.data.url = match.text ),
			// Give priority to other finders that are also matching urls.
			priority: 'low',
			conversion: {
				'editingDowncast': () => 'autolink'
			}
		} );
	}
}
