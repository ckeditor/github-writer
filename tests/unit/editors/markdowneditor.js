/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../../../src/app/editor';
import MarkdownEditor from '../../../src/app/editors/markdowneditor';

import { GitHubPage } from '../../_util/githubpage';

describe( 'Editors', () => {
	describe( 'MarkdownEditor', () => {
		describe( 'constructor()', () => {
			it( 'should save dom references', () => {
				const root = GitHubPage.appendRoot();
				const editor = new Editor( root );
				const markdownEditor = new MarkdownEditor( editor );

				expect( markdownEditor ).to.have.property( 'dom' );
				expect( markdownEditor.dom.root ).to.equals( root );
			} );
		} );
	} );
} );
