/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../editor/editor';
import { injectFunctionExecution } from '../modules/util';

export default class CodeEditor extends Editor {
	constructor( root ) {
		super( root );

		root.classList.add( 'github-writer-type-code' );

		registerUpdateListener( this );
	}

	get type() {
		return 'CodeEditor';
	}

	getDom( root ) {
		const dom = super.getDom( root );

		dom.toolbarContainer = root.querySelector( '.file-header' );
		dom.panels.markdown = root.querySelector( '.commit-create' );
		dom.panels.preview = root.querySelector( '.commit-preview' );
		dom.panelsContainer = dom.panels.markdown.parentElement;

		dom.isEdit = true;

		delete dom.tabs;
		delete dom.toolbar;

		return dom;
	}

	getCKEditorConfig() {
		const config = super.getCKEditorConfig();

		// Markdown files support autolinking on urls only.
		config.githubWriter && ( config.githubWriter.autoLinking = { url: true } );

		return config;
	}

	injectToolbar( toolbarElement ) {
		// Inject the rte toolbar at the end of the toolbar container.
		this.domManipulator.append( this.dom.toolbarContainer, toolbarElement );
	}

	injectEditable( editable ) {
		const container = this.createEditableContainer( editable );
		this.domManipulator.appendAfter( this.dom.root.querySelector( '.commit-create' ), container );
	}

	static run() {
		// Unfortunately Firefox doesn't seem to give any way for us to update CodeMirror when switching rte -> markdown.
		// As for now, we're not supporting the code editor in Firefox.
		// The manifest is also changed to reflect this. See webpack.config.js.
		/* istanbul ignore next */
		if ( !window.chrome ) {
			return;
		}

		const root = document.querySelector( 'form.js-blob-form' );

		// Enable it for markdown editing only.
		const textarea = root && root.querySelector( 'textarea[data-codemirror-mode="text/x-gfm"]' );

		return textarea ? this.createEditor( root ) : Promise.resolve( false );
	}
}

/**
 * Registers a listener that fires the update of the CodeMirror instance with textarea
 * containing the actual editor data.
 *
 * CodeMirror is exposed as a property of its container <div> in the document. For security
 * reasons, we cannot access that object from the extension, so we need to do it through window
 * messaging.
 */
function registerUpdateListener( editor ) {
	editor.on( 'mode', ( ev, { from, to } ) => {
		if ( from === Editor.modes.RTE && to === Editor.modes.MARKDOWN ) {
			window.postMessage( {
				type: 'GitHub-Writer-CodeEditor-Update',
				id: editor.id
			}, '*' );
		}
	} );

	if ( !registerUpdateListener.ready ) {
		const register = /* istanbul ignore next */ function() {
			window.addEventListener( 'message', event => {
				if ( event.data.type === 'GitHub-Writer-CodeEditor-Update' ) {
					// Retrieve the editor root, the textarea and the CodeMirror instance.
					const root = document.querySelector( `form[data-github-writer-id="${ event.data.id }"]` );
					const textarea = root.querySelector( 'textarea' );
					const codeMirror = root.querySelector( '.CodeMirror' ).CodeMirror;

					codeMirror.setValue( textarea.value );
				}
			}, false );
		};

		// Different ways to o it for Chrome and Firefox.
		// We're actually not supporting Firefox at this stage. See run().
		window.chrome ? injectFunctionExecution( register ) : /* istanbul ignore next */ register();

		registerUpdateListener.ready = true;
	}
}
