/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import DecoupledEditor from '@ckeditor/ckeditor5-editor-decoupled/src/decouplededitor';
import GFMDataProcessor from '@ckeditor/ckeditor5-markdown-gfm/src/gfmdataprocessor';
import CKEditorInspector from '@ckeditor/ckeditor5-inspector';
import AttributeElement from '@ckeditor/ckeditor5-engine/src/view/attributeelement';

import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Enter from '../plugins/enter';
import AutoFormat from '../plugins/autoformat';

import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import SmartCode from '../plugins/smartcode';
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';
import Kbd from '@mlewand/ckeditor5-keyboard-marker/src/Kbd';

import HeadingDropdown from '../plugins/headingdropdown';

import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote';

import List from '@ckeditor/ckeditor5-list/src/list';
import TodoList from '@ckeditor/ckeditor5-list/src/todolist';

import Link from '@ckeditor/ckeditor5-link/src/link';

import Image from '@ckeditor/ckeditor5-image/src/image';
import ImageUpload from '@ckeditor/ckeditor5-image/src/imageupload';
import GitHubUploadAdapter from '../plugins/githubuploadadapter';

import HorizontalLine from '@ckeditor/ckeditor5-horizontal-line/src/horizontalline';

import Table from '@ckeditor/ckeditor5-table/src/table';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';

import Mention from '@ckeditor/ckeditor5-mention/src/mention';
import Emoji from '../plugins/emoji';

import Kebab from '../plugins/kebab';
import RemoveFormat from '@ckeditor/ckeditor5-remove-format/src/removeformat';
import ModeSwitcher from '../plugins/modeswitcher';
import Suggestion from '../plugins/suggestion';

import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import PasteFixer from '../plugins/pastefixer';
import AutoLinkUrl from '../plugins/autolinkurl';
import AutoLinkGitHub from '../plugins/autolinkgithub';
import QuoteSelection from '../plugins/quoteselection';
import Messenger from '../plugins/messenger';
import EditorExtras from '../plugins/editorextras';
import ControlClick from '../plugins/controlclick';
import SmartCaret from '../plugins/smartcaret';
import CodeBlockLanguageSelector from '../plugins/codeblocklanguageselector';
import SavedReplies from '../plugins/savedreplies';
import LiveModelData from '../plugins/livemodeldata';

// Inject our very own CKEditor theme overrides.
import '../theme/githubwriter.css';

/**
 * The CKEditor used inside the rte editor.
 */
export default class CKEditorGitHubEditor extends DecoupledEditor {
	constructor( initialData, config ) {
		super( initialData, config );

		const dp = new GFMDataProcessor( this.data.viewDocument );
		dp.keepHtml( 'kbd' );

		this.data.processor = dp;

		// Adds our very own class to the toolbar.
		this.ui.view.toolbar.extendTemplate( {
			attributes: {
				class: 'github-writer-toolbar'
			}
		} );

		// Fix the priority of the code element so it'll not contain other inline styles.
		// This is basically a copy of the original code in codeediting.js.
		// TODO: Move this to the Markdown plugin, as this is a requirement there.
		this.conversion.attributeToElement( {
			model: 'code',
			view: { name: 'code', priority: AttributeElement.DEFAULT_PRIORITY + 1 },
			upcastAlso: {
				styles: {
					'word-wrap': 'break-word'
				}
			}
		} );
	}

	inspect() {
		CKEditorInspector.attach( this );
	}
}

CKEditorGitHubEditor.builtinPlugins = [
	Essentials, Paragraph, Enter, AutoFormat, Mention, Emoji,
	Image, ImageUpload, GitHubUploadAdapter,
	HeadingDropdown,
	Bold, Italic, SmartCode, Strikethrough, Kbd,
	BlockQuote,
	Link,
	List, TodoList,
	HorizontalLine, Table, TableToolbar,
	Kebab, RemoveFormat, ModeSwitcher, Suggestion,
	PasteFromOffice, PasteFixer,
	AutoLinkUrl, AutoLinkGitHub,
	QuoteSelection, SavedReplies, Messenger, EditorExtras, ControlClick, SmartCaret,
	CodeBlockLanguageSelector,
	LiveModelData
];
