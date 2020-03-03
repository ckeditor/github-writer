/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import App from '../../src/app/app';
import PageManager from '../../src/app/pagemanager';
import { createElementFromHtml, DomManipulator } from '../../src/app/util';

import templateRoot from './html/root.html';
import templateButtonEdit from './html/button-edit.html';
import templateButtonPrInlineComment from './html/button-pr-inline-comment.html';
import templateButtonCodeLineComment from './html/button-code-line-comment.html';

const domManipulator = new DomManipulator();
let textareaId = 0;

export const GitHubPage = {
	domManipulator,

	setApp: () => {
		App.pageManager = new PageManager();
		domManipulator.addRollbackOperation( () => delete App.pageManager );
	},

	setPageName: ( name = 'repo_issue' ) => {
		let meta = document.querySelector( 'meta[name="selected-link"]' );
		if ( !meta ) {
			meta = document.createElement( 'meta' );
			meta.setAttribute( 'name', 'selected-link' );
			domManipulator.append( document.body, meta );
		}

		meta.setAttribute( 'value', name || 'repo_issue' );
	},

	/**
	 * Creates and element from its outer html and appends it to the page.
	 *
	 * @param html {String} The element outer html.
	 * @return {HTMLElement} The created element.
	 */
	appendElementHtml: html => {
		const element = createElementFromHtml( html );
		domManipulator.append( document.body, element );
		return element;
	},

	/**
	 * Appends to the page a valid root element that can be used to create editors.
	 *
	 * @param [options] {Object}
	 * @param [options.type='issue'] {String} The type of root to be create.
	 * @param [options.target=document.body] {HTMLElement} The parent element of the new root element.
	 * @param [options.text=''] {String} The initial value of the root textarea.
	 * @param [options.submitAlternative=false] {Boolean} Whether to include a "submit alternative" button in the root.
	 *
	 * @return {HTMLElement}
	 */
	appendRoot: ( options = { type: 'issue', target: document.body, text: '', submitAlternative: false } ) => {
		const type = options.type || 'issue';
		const target = options.target || document.body;

		const root = createElementFromHtml( templateRoot );
		let container = root;

		switch ( type ) {
			case 'issue': {
				root.setAttribute( 'id', 'new_issue' );
				break;
			}
			case 'pull-request': {
				root.setAttribute( 'id', 'new_pull_request' );
				break;
			}
			case 'comment': {
				root.classList.add( 'js-new-comment-form' );
				break;
			}
			case 'pull-request-review': {
				container = document.createElement( 'div' );
				container.classList.add( 'pull-request-review-menu' );
				container.append( root );
				break;
			}
			case 'comment-code-line': {
				container = document.createElement( 'div' );
				container.classList.add( 'inline-comment-form-container', 'open' );
				container.append( root );

				root.classList.add( 'js-inline-comment-form' );
				break;
			}
			case 'comment-edit': {
				container = document.createElement( 'div' );
				container.classList.add( 'is-comment-editing' );
				container.append( root );

				root.classList.add( 'js-comment-update' );

				// Rename 'tab-container' to 'div'.
				const panelContainer = container.querySelector( 'tab-container' );
				const panelContainerDiv = createElementFromHtml( panelContainer.outerHTML.replace( 'tab-container', 'div' ) );
				panelContainer.parentElement.replaceChild( panelContainerDiv, panelContainer );

				// Remove the wrong preview pane class for this case.
				root.querySelector( '.preview-content' ).classList.remove( 'js-preview-panel' );
				break;
			}
			case 'wiki': {
				root.setAttribute( 'name', 'gollum-editor' );
				break;
			}
			default: {
				expect.fail( `unknown root type "${ type }"` );
			}
		}

		if ( options.text ) {
			root.querySelector( 'textarea' ).value = options.text;
		}

		if ( options.submitAlternative ) {
			root.querySelector( 'button[type="submit"]' ).insertAdjacentHTML( 'afterend',
				'<button class="js-quick-submit-alternative">Alternative</button>' );
		}

		root.querySelector( 'textarea' ).id = 'test-' + ( ++textareaId );

		domManipulator.append( target, container );
		return root;
	},

	appendButton: ( options = { type: 'edit' } ) => {
		const type = options.type || 'edit';
		let html, rootType;

		switch ( type ) {
			case 'edit': {
				html = templateButtonEdit;
				rootType = 'comment-edit';
				break;
			}
			case 'pr-inline-comment' : {
				html = templateButtonPrInlineComment;
				rootType = 'comment-edit';
				break;
			}
			case 'code-line-comment' : {
				html = templateButtonCodeLineComment;
				rootType = 'comment-code-line';
				break;
			}
		}

		const container = createElementFromHtml( html );
		const root = GitHubPage.appendRoot( {
			type: rootType,
			target: container.querySelector( '.root-container' )
		} );
		domManipulator.append( document.body, container );

		const button = container.querySelector( '.test-button' );

		if ( type === 'code-line-comment' ) {
			domManipulator.addEventListener( button, 'click', () => {
				container.dispatchEvent( new CustomEvent( 'inlinecomment:focus', { bubbles: true } ) );
			} );
		}

		return {
			button,
			root
		};
	},

	reset: () => {
		domManipulator.rollback();
	}
};
