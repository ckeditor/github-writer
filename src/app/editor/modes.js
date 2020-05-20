/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * The possible modes an {Editor} can be:
 *   - RTE: the rte editor is active.
 *   - MARKDOWN: the markdown editor is active.
 *   - UNKNOWN: the current mode is not set (during initialization).
 *
 * @type {{RTE: string, MARKDOWN: string, UNKNOWN: null}}
 */
const editorModes = {
	RTE: 'rte',
	MARKDOWN: 'markdown',
	DESTROYED: 'destroyed',
	UNKNOWN: null
};

export default editorModes;
