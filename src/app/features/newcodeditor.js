/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import CodeEditor from './codeditor';
import editorModes from '../editor/modes';

export default class NewCodeEditor extends CodeEditor {
	constructor( ...args ) {
		super( ...args );

		this._setupFileNameListener();
		this._checkFileType();
	}

	get type() {
		return 'NewCodeEditor';
	}

	_setInitialMode() {
		super._setInitialMode( editorModes.MARKDOWN );
	}

	_setupFileNameListener() {
		const el = this.dom.root.querySelector( 'input[name="filename"]' );
		if ( el ) {
			el.addEventListener( 'input', () => this._checkFileType() );
		}
	}

	_checkFileType() {
		const el = this.dom.root.querySelector( 'input[name="filename"]' );
		const isMarkdown = el && /\.(?:md|mkdn?|mdown|markdown)\s*$/i.test( el.value );
		this.dom.root.classList.toggle( 'github-writer-code-editor-not-md', !isMarkdown );
	}

	static run() {
		return this.createEditor( 'form.js-blob-form' );
	}
}
