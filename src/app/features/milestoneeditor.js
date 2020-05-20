/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../editor/editor';

import SelectAll from '@ckeditor/ckeditor5-select-all/src/selectall';
import Typing from '@ckeditor/ckeditor5-typing/src/typing';
import Undo from '@ckeditor/ckeditor5-undo/src/undo';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import AutoFormat from '../plugins/autoformat';
import Mention from '@ckeditor/ckeditor5-mention/src/mention';
import Emoji from '../plugins/emoji';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import SmartCode from '../plugins/smartcode';
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';
import Kbd from '@mlewand/ckeditor5-keyboard-marker/src/Kbd';
import Link from '@ckeditor/ckeditor5-link/src/link';
import Kebab from '../plugins/kebab';
import RemoveFormat from '@ckeditor/ckeditor5-remove-format/src/removeformat';
import ModeSwitcher from '../plugins/modeswitcher';
import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import PasteFixer from '../plugins/pastefixer';
import AutoLinkUrl from '../plugins/autolinkurl';
import Messenger from '../plugins/messenger';
import EditorExtras from '../plugins/editorextras';
import ControlClick from '../plugins/controlclick';
import SmartCaret from '../plugins/smartcaret';
import LiveModelData from '../plugins/livemodeldata';
import Clipboard from '@ckeditor/ckeditor5-clipboard/src/clipboard';

export default class MilestoneEditor extends Editor {
	constructor( root ) {
		super( root );

		root.classList.add( 'github-writer-type-milestone' );
	}

	getDom( root ) {
		const dom = super.getDom( root );

		dom.panels.markdown = dom.textarea.closest( 'text-expander' );
		dom.panels.preview = dom.panels.markdown;

		delete dom.panelsContainer;
		delete dom.tabs;
		delete dom.toolbar;

		return dom;
	}

	getSizeContainer() {
		return null;
	}

	injectToolbar( toolbarElement ) {
		const container = document.createElement( 'div' );
		container.classList = 'github-writer-toolbar-container d-flex flex-justify-end bg-white';
		container.appendChild( toolbarElement );

		// Inject the rte toolbar right next to the markdown editor toolbar.
		this.domManipulator.prepend( this.dom.textarea.closest( '.write-content' ), container );
	}

	injectEditable( editable ) {
		const container = this.createEditableContainer( editable );
		container.classList.remove( 'mx-md-2' );

		// Add the editor after the actual GH panels container, to avoid the GH panels show/hide logic to touch it.
		this.domManipulator.append( this.dom.textarea.closest( '.write-content' ), container );
	}

	_getCKEditorConfig() {
		const config = super._getCKEditorConfig();

		// This is not working.
		// config.removePlugins = [
		// 	'Enter', 'ShiftEnter',
		// 	'Image', 'ImageUpload', 'GitHubUploadAdapter',
		// 	'HeadingDropdown', 'HeadingTabKey',
		// 	'BlockQuote',
		// 	'List', 'TodoList',
		// 	'HorizontalLine', 'Table', 'TableToolbar',
		// 	'Suggestion',
		// 	'AutoLinkGitHub',
		// 	'QuoteSelection', 'SavedReplies', 'ControlClick', 'SmartCaret',
		// 	'CodeBlockLanguageSelector'
		// ];

		config.plugins = [
			Clipboard, SelectAll, Typing, Undo,		// Instead of Essentials
			Paragraph, AutoFormat, Mention, Emoji,
			Bold, Italic, SmartCode, Strikethrough, Kbd,
			Link,
			Kebab, RemoveFormat, ModeSwitcher,
			PasteFromOffice, PasteFixer,
			AutoLinkUrl,
			Messenger, EditorExtras, ControlClick, SmartCaret,
			LiveModelData
		];

		config.toolbar = [
			'bold', 'italic', 'strikethrough', 'kbd', '|',
			'smartcode', 'link', '|',
			'kebab'
		];

		config.kebabToolbar = [ 'mode' ];

		config.githubWriter.autoLinking = { url: true };

		return config;
	}

	static run() {
		return this.createEditor( 'form#new_milestone, form.js-milestone-edit-form' );
	}
}
