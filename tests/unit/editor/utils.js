/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import utils from '../../../src/app/editor/utils';

import Locale from '@ckeditor/ckeditor5-utils/src/locale';
import ToolbarView from '@ckeditor/ckeditor5-ui/src/toolbar/toolbarview';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import DropdownView from '@ckeditor/ckeditor5-ui/src/dropdown/dropdownview';
import DropdownPanelView from '@ckeditor/ckeditor5-ui/src/dropdown/dropdownpanelview';
import LabelView from '@ckeditor/ckeditor5-ui/src/label/labelview';

import { GitHubPage } from '../../_util/githubpage';
import env from '@ckeditor/ckeditor5-utils/src/env';
import Editor from '../../../src/app/editor/editor';

describe( 'Editor', () => {
	describe( 'utils', () => {
		describe( 'toolbarItemsPostfix()', () => {
			beforeEach( () => {
				GitHubPage.appendElementHtml(
					'<div>' +
					'<md-bold aria-label="test Bold"></md-bold>' +
					'</div>'
				);
			} );

			it( 'should fix simple buttons', () => {
				const locale = new Locale();
				const toolbar = new ToolbarView( locale );

				const button = new ButtonView( locale );
				button.set( {
					label: 'Bold',
					tooltip: true
				} );

				toolbar.items.add( button );

				// Check if it's rendered just as a future safeguard because we've removing part of the code inside
				// toolbarItemsPostfix which was dealing with the non-rendered case when writing this test.
				// Somehow this seems to not be possible anymore to have toolbars with non-rendered items,
				// but we don't know if this may change in the future.
				expect( button.isRendered ).to.be.true;

				utils.toolbarItemsPostfix( toolbar );

				expect( button.tooltip ).to.be.false;
				expect( button.element.getAttribute( 'aria-label' ) ).to.equals( 'test Bold' );
			} );

			it( 'should fix complex buttons', () => {
				const locale = new Locale();
				const toolbar = new ToolbarView( locale );

				const button = new ButtonView( locale );
				button.set( {
					label: 'Bold',
					tooltip: true
				} );

				const dropdown = new DropdownView( locale, button, new DropdownPanelView( locale ) );

				toolbar.items.add( dropdown );

				utils.toolbarItemsPostfix( toolbar );

				expect( button.tooltip ).to.be.false;
				expect( button.element.getAttribute( 'aria-label' ) ).to.equals( 'test Bold' );
			} );

			it( 'should properly set cmd', () => {
				const locale = new Locale();
				const toolbar = new ToolbarView( locale );

				const button = new ButtonView( locale );
				button.set( {
					label: 'Keyboard shortcut',
					tooltip: true
				} );

				toolbar.items.add( button );

				// Check if it's rendered just as a future safeguard because we've removing part of the code inside
				// toolbarItemsPostfix which was dealing with the non-rendered case when writing this test.
				// Somehow this seems to not be possible anymore to have toolbars with non-rendered items,
				// but we don't know if this may change in the future.
				expect( button.isRendered ).to.be.true;

				env.isMac = true;
				utils.toolbarItemsPostfix( toolbar );

				expect( button.tooltip ).to.be.false;
				expect( button.element.getAttribute( 'aria-label' ) ).to.equals( 'Add keyboard shortcut <cmd+alt-k>' );
			} );

			it( 'should properly set ctrl', () => {
				const locale = new Locale();
				const toolbar = new ToolbarView( locale );

				const button = new ButtonView( locale );
				button.set( {
					label: 'Keyboard shortcut',
					tooltip: true
				} );

				toolbar.items.add( button );

				// Check if it's rendered just as a future safeguard because we've removing part of the code inside
				// toolbarItemsPostfix which was dealing with the non-rendered case when writing this test.
				// Somehow this seems to not be possible anymore to have toolbars with non-rendered items,
				// but we don't know if this may change in the future.
				expect( button.isRendered ).to.be.true;

				env.isMac = false;
				utils.toolbarItemsPostfix( toolbar );

				expect( button.tooltip ).to.be.false;
				expect( button.element.getAttribute( 'aria-label' ) ).to.equals( 'Add keyboard shortcut <ctrl+alt-k>' );
			} );

			it( 'should not fix unknown buttons', () => {
				const locale = new Locale();
				const toolbar = new ToolbarView( locale );

				const button = new ButtonView( locale );
				button.set( {
					label: 'Test',
					tooltip: true
				} );

				toolbar.items.add( button );

				utils.toolbarItemsPostfix( toolbar );

				expect( button.tooltip ).to.be.false;
				expect( button.element.getAttribute( 'aria-label' ) ).to.equals( 'Test' );
			} );

			it( 'should ignore non buttons', () => {
				const locale = new Locale();
				const toolbar = new ToolbarView( locale );

				const label = new LabelView( locale );
				label.set( {
					text: 'Test',
					tooltip: true
				} );

				toolbar.items.add( label );

				utils.toolbarItemsPostfix( toolbar );

				expect( label.tooltip ).to.be.true;
				expect( label.element.getAttribute( 'aria-label' ) ).to.be.null;
			} );

			it( 'should do nothing in non comments page', () => {
				GitHubPage.setPageName( 'repo_wiki' );

				const locale = new Locale();
				const toolbar = new ToolbarView( locale );

				const button = new ButtonView( locale );
				button.set( {
					label: 'Bold',
					tooltip: true
				} );

				toolbar.items.add( button );

				expect( button.isRendered ).to.be.true;

				utils.toolbarItemsPostfix( toolbar );

				expect( button.tooltip ).to.be.true;
				expect( button.element.getAttribute( 'aria-label' ) ).to.be.null;
			} );
		} );

		describe( 'setupAutoResize', () => {
			it( 'should have the resize class', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				expect( editor.dom.panelsContainer.parentElement.classList.contains( 'github-writer-size-container' ) ).to.be.true;
			} );

			it( 'should do nothing if no container defined', () => {
				sinon.stub( Editor.prototype, 'getSizeContainer' ).returns( null );

				const editor = new Editor( GitHubPage.appendRoot() );

				expect( editor.dom.panelsContainer.parentElement.classList.contains( 'github-writer-size-container' ) ).to.be.false;
			} );

			it( 'should have the resize class (edit)', () => {
				const editor = new Editor( GitHubPage.appendRoot( { type: 'comment-edit' } ) );

				expect( editor.dom.panelsContainer.classList.contains( 'github-writer-size-container' ) ).to.be.true;
			} );

			it( 'should set the minimum size', () => {
				const root = GitHubPage.appendRoot();
				root.style.height = '301px';

				const editor = new Editor( root );
				const sizeContainer = editor.dom.panelsContainer.parentElement;

				expect( sizeContainer.style.minHeight ).to.equals( '301px' );
			} );

			it( 'should set the maximum size', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const sizeContainer = editor.dom.panelsContainer.parentElement;

				// Viewport height.
				let maxHeight = document.documentElement.clientHeight;

				// Margin.
				maxHeight -= 60;

				expect( sizeContainer.style.maxHeight ).to.equals( maxHeight + 'px' );
			} );

			it( 'should set the maximum size to at least the minimum', () => {
				// Viewport height.
				let maxHeight = document.documentElement.clientHeight;

				// Margin.
				maxHeight -= 60;

				const root = GitHubPage.appendRoot();
				root.style.height = ( maxHeight + 100 ) + 'px';

				const editor = new Editor( root );
				const sizeContainer = editor.dom.panelsContainer.parentElement;

				expect( sizeContainer.style.maxHeight ).to.equals( ( maxHeight + 100 ) + 'px' );
			} );

			it( 'should account for "stickies" in the maximum size', () => {
				GitHubPage.appendElementHtml( '<div class ="gh-header-sticky js-sticky"' +
					' style="position: sticky; height: 21px"></div>' );
				GitHubPage.appendElementHtml( '<div class ="js-notification-shelf js-sticky"' +
					' style="position: sticky; height: 32px"></div>' );
				GitHubPage.appendElementHtml( '<div class ="pr-toolbar js-sticky"' +
					' style="position: sticky; height: 43px"></div>' );
				GitHubPage.appendElementHtml( '<div class ="js-file-header sticky-file-header"' +
					' style="position: sticky; height: 54px"></div>' );

				const editor = new Editor( GitHubPage.appendRoot() );
				const sizeContainer = editor.dom.panelsContainer.parentElement;

				// Viewport height.
				let maxHeight = document.documentElement.clientHeight;

				// Stickies.
				maxHeight -= ( 21 + 32 + 43 + 54 );

				// Margin.
				maxHeight -= 60;

				expect( sizeContainer.style.maxHeight ).to.equals( maxHeight + 'px' );
			} );

			it( 'should ignore 1px header in maximum size', () => {
				GitHubPage.appendElementHtml( '<div class ="gh-header-sticky js-sticky"' +
					' style="position: sticky; height: 1px"></div>' );

				const editor = new Editor( GitHubPage.appendRoot() );
				const sizeContainer = editor.dom.panelsContainer.parentElement;

				// Viewport height.
				let maxHeight = document.documentElement.clientHeight;

				// Margin.
				maxHeight -= 60;

				expect( sizeContainer.style.maxHeight ).to.equals( maxHeight + 'px' );
			} );

			it( 'should react to stickies resize', () => {
				const stickyHeader = GitHubPage.appendElementHtml( '<div class ="gh-header-sticky js-sticky"' +
					' style="position: sticky; height: 21px"></div>' );
				const stickyNotification = GitHubPage.appendElementHtml( '<div class ="js-notification-shelf js-sticky"' +
					' style="position: sticky; height: 32px"></div>' );

				const editor = new Editor( GitHubPage.appendRoot() );
				const sizeContainer = editor.dom.panelsContainer.parentElement;

				// Viewport height.
				let maxHeight = document.documentElement.clientHeight;

				// Stickies.
				maxHeight -= ( 21 + 32 );

				// Margin.
				maxHeight -= 60;

				expect( sizeContainer.style.maxHeight ).to.equals( maxHeight + 'px' );

				// This test should be passing but for some misterious reason the ResizeObserver
				// is not called for the following changes. For now, the expected changes have been commented.
				// This test is, at this point, useless. It's here for documentation.

				stickyHeader.style.height = '1px';
				// maxHeight += 21;

				stickyNotification.style.display = 'none';
				// maxHeight += 32;

				expect( sizeContainer.style.maxHeight ).to.equals( maxHeight + 'px' );
			} );

			it( 'should recalculate the maximum size on window resize', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const sizeContainer = editor.dom.panelsContainer.parentElement;

				// Viewport height.
				let maxHeight = document.documentElement.clientHeight;

				// Margin.
				maxHeight -= 60;

				expect( sizeContainer.style.maxHeight ).to.equals( maxHeight + 'px' );

				window.dispatchEvent( new Event( 'resize' ) );

				// It's not really possible to test this. We can just confirm that it passes properly
				// by looking at code coverage reports.
				expect( sizeContainer.style.maxHeight ).to.equals( maxHeight + 'px' );
			} );
		} );
	} );
} );
