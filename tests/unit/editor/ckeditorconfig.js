/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../../../src/app/editor/editor';

import { GitHubPage } from '../../_util/githubpage';
import CKEditorConfig from '../../../src/app/editor/ckeditorconfig';
import CKEditorConfigMentions from '../../../src/app/editor/ckeditorconfigmentions';
import SavedReplies from '../../../src/app/plugins/savedreplies';

describe( 'Editor', () => {
	describe( 'CKEditorConfig', () => {
		beforeEach( () => {
			CKEditorConfig.get.restore();
		} );

		it( 'should return a configuration object', () => {
			const editor = new Editor( GitHubPage.appendRoot() );
			const config = CKEditorConfig.get( editor );

			expect( config ).to.be.an( 'object' );
			expect( config.toolbar ).to.be.an( 'array' );
		} );

		it( 'should set the placeholder text', () => {
			const editor = new Editor( GitHubPage.appendRoot() );
			const config = CKEditorConfig.get( editor );

			expect( config.placeholder ).to.be.a( 'string' ).not.empty;
		} );

		describe( 'mentions.feeds', () => {
			it( 'should retrieve urls from the dom', () => {
				const textExpander = GitHubPage.appendElementHtml(
					'<text-expander' +
					' data-issue-url="/test-issues"' +
					' data-mention-url="/test-mentions"' +
					' data-emoji-url="/test-emojis"' +
					'></text-expander>' );

				const editor = new Editor( GitHubPage.appendRoot( { target: textExpander } ) );

				const spy = sinon.spy( CKEditorConfigMentions, 'get' );

				CKEditorConfig.get( editor );

				expect( spy.callCount ).to.equals( 1 );
				expect( spy.args[ 0 ][ 0 ].issues ).to.equals( '/test-issues' );
				expect( spy.args[ 0 ][ 0 ].people ).to.equals( '/test-mentions' );

				// Emoji is actually ignored and should return an array.
				expect( spy.args[ 0 ][ 0 ].emoji ).to.be.an( 'array' );
			} );

			it( 'should retrieve emojis only if no urls in the dom', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				const spy = sinon.spy( CKEditorConfigMentions, 'get' );

				CKEditorConfig.get( editor );

				expect( spy.callCount ).to.equals( 1 );
				expect( spy.args[ 0 ][ 0 ].issues ).to.be.undefined;
				expect( spy.args[ 0 ][ 0 ].people ).to.be.undefined;
				expect( spy.args[ 0 ][ 0 ].emoji ).to.be.an( 'array' );
			} );
		} );

		describe( 'githubWriter.upload', () => {
			it( 'should retrieve urls from the dom', () => {
				const uploadElement = GitHubPage.appendElementHtml(
					'<div' +
					' data-upload-policy-url="/test-upload"' +
					' data-upload-policy-authenticity-token="token"' +
					' data-upload-repository-id="repo_id"' +
					'></div>' );

				const editor = new Editor( GitHubPage.appendRoot( { target: uploadElement } ) );

				const config = CKEditorConfig.get( editor );
				expect( config.githubWriter.upload ).to.be.a( 'function' );

				const promise = config.githubWriter.upload();
				expect( promise ).to.be.an.instanceOf( Promise );

				return promise.then( uploadConfig => {
					expect( uploadConfig.url ).to.equals( '/test-upload' );
					expect( uploadConfig.form.authenticity_token ).to.equals( 'token' );
					expect( uploadConfig.form.repository_id ).to.equals( 'repo_id' );
				} );
			} );

			it( 'should retrieve urls from the dom (inner token)', () => {
				const uploadElement = GitHubPage.appendElementHtml(
					'<div' +
					' data-upload-policy-url="/test-upload"' +
					' data-upload-repository-id="repo_id"' +
					'>' +
					'<input class="js-data-upload-policy-url-csrf" type="hidden" value="token">' +
					'</div>' );

				const editor = new Editor( GitHubPage.appendRoot( { target: uploadElement } ) );

				const config = CKEditorConfig.get( editor );
				expect( config.githubWriter.upload ).to.be.a( 'function' );

				const promise = config.githubWriter.upload();
				expect( promise ).to.be.an.instanceOf( Promise );

				return promise.then( uploadConfig => {
					expect( uploadConfig.url ).to.equals( '/test-upload' );
					expect( uploadConfig.form.authenticity_token ).to.equals( 'token' );
					expect( uploadConfig.form.repository_id ).to.equals( 'repo_id' );
				} );
			} );

			it( 'should retrieve urls from the new issue page when in wiki', () => {
				GitHubPage.setPageName( 'repo_wiki' );

				// This will fix the url.
				sinon.stub( window, '__getLocation' ).returns( {
					protocol: 'https:',
					host: 'test.com',
					pathname: '/org/repo/test'
				} );

				let xhr;
				const sinonXhr = sinon.useFakeXMLHttpRequest();
				sinonXhr.onCreate = createdXhr => ( xhr = createdXhr );

				const editor = new Editor( GitHubPage.appendRoot( { type: 'wiki' } ) );

				const config = CKEditorConfig.get( editor );
				expect( config.githubWriter.upload ).to.be.a( 'function' );

				const promise = config.githubWriter.upload();
				expect( promise ).to.be.an.instanceOf( Promise );

				expect( xhr.url ).to.equals( 'https://test.com/org/repo/issues/new' );

				xhr.respond( 200, { 'Content-Type': 'text/html' },
					'<!DOCTYPE html>\n' +
					'<html lang="en">' +
					'<head>' +
					'<title></title>' +
					'</head>' +
					'<body>' +
					'<div' +
					' data-upload-policy-url="/test-upload"' +
					' data-upload-policy-authenticity-token="token"' +
					' data-upload-repository-id="repo_id"' +
					'>' +
					'<input class="js-data-upload-policy-url-csrf" type="hidden" value="token">' +
					'</div>' +
					'</body>' +
					'</html>' );

				return promise.then( uploadConfig => {
					expect( uploadConfig.url ).to.equals( '/test-upload' );
					expect( uploadConfig.form.authenticity_token ).to.equals( 'token' );
					expect( uploadConfig.form.repository_id ).to.equals( 'repo_id' );
				} );
			} );

			it( 'should return the same promise on second call', () => {
				const uploadElement = GitHubPage.appendElementHtml(
					'<div' +
					' data-upload-policy-url="/test-upload"' +
					' data-upload-policy-authenticity-token="token"' +
					' data-upload-repository-id="repo_id"' +
					'></div>' );

				const editor = new Editor( GitHubPage.appendRoot( { target: uploadElement } ) );

				const config = CKEditorConfig.get( editor );
				expect( config.githubWriter.upload ).to.be.a( 'function' );

				const promise = config.githubWriter.upload();
				expect( promise ).to.be.an.instanceOf( Promise );

				expect( config.githubWriter.upload() ).to.be.equals( promise );
			} );
		} );

		describe( 'githubWriter.autoLinking', () => {
			it( 'should have all features enabled in comment pages', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const config = CKEditorConfig.get( editor );

				expect( config.githubWriter.autoLinking ).to.eql( {
					person: true,
					issue: true,
					sha: true,
					urlGitHub: true,
					url: true
				} );
			} );
		} );

		describe( 'githubWriter.suggestion.enabled', () => {
			it( 'should check if suggestion is enabled in the markdown editor', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				editor.dom.toolbar.insertAdjacentHTML( 'beforeend',
					'<button class="js-suggested-change-toolbar-item">Suggestion</button>' );

				const config = CKEditorConfig.get( editor );
				expect( config.githubWriter.suggestion.enabled ).to.be.true;
			} );

			it( 'should check if suggestion is not enabled in the markdown editor', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				const config = CKEditorConfig.get( editor );
				expect( config.githubWriter.suggestion.enabled ).to.be.false;
			} );

			it( 'should add a button to the toolbar if enabled', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				editor.dom.toolbar.insertAdjacentHTML( 'beforeend',
					'<button class="js-suggested-change-toolbar-item">Suggestion</button>' );

				const config = CKEditorConfig.get( editor );
				expect( config.toolbar[ 0 ] ).to.equals( 'suggestion' );
				expect( config.toolbar[ 1 ] ).to.equals( '|' );
			} );
		} );

		describe( 'githubWriter.savedReplies.url', () => {
			it( 'should take the url from the dom', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				editor.dom.toolbar.insertAdjacentHTML( 'beforeend',
					'<details-menu class="js-saved-reply-menu" src="https://test.com/sr">Saved Replies</details-menu>' );

				const config = CKEditorConfig.get( editor );
				expect( config.githubWriter.savedReplies.url ).to.equals( 'https://test.com/sr' );
			} );

			it( 'should have the Saved Replies feature if available', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				editor.dom.toolbar.insertAdjacentHTML( 'beforeend',
					'<details-menu class="js-saved-reply-menu" src="https://test.com/sr">Saved Replies</details-menu>' );

				const config = CKEditorConfig.get( editor );
				expect( config.toolbar ).to.include( 'savedreplies' );
				expect( config.plugins ).to.include( SavedReplies );
			} );

			it( 'should remove the Saved Replies feature if not available', () => {
				const editor = new Editor( GitHubPage.appendRoot() );

				const config = CKEditorConfig.get( editor );
				expect( config.toolbar ).to.not.include( 'savedreplies' );
				expect( config.plugins ).to.not.include( SavedReplies );
			} );
		} );
	} );
} );
