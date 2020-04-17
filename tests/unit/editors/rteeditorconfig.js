/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Editor from '../../../src/app/editor';
import RteEditor from '../../../src/app/editors/rteeditor';

import { GitHubPage } from '../../_util/githubpage';
import RteEditorConfig from '../../../src/app/editors/rteeditorconfig';
import RteEditorConfigMentions from '../../../src/app/editors/rteeditorconfigmentions';

describe( 'Editors', () => {
	describe( 'RteEditorConfig', () => {
		it( 'should return a configuration object', () => {
			const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );
			const config = RteEditorConfig.get( rteEditor );

			expect( config ).to.be.an( 'object' );
			expect( config.plugins ).to.be.an( 'array' );
			expect( config.toolbar ).to.be.an( 'array' );
		} );

		it( 'should set the placeholder text', () => {
			const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );
			const config = RteEditorConfig.get( rteEditor );

			expect( config.placeholder ).to.be.a( 'string' ).not.empty;
		} );

		it( 'should set no placeholder when in wiki page', () => {
			GitHubPage.setPageName( 'repo_wiki' );

			const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );
			const config = RteEditorConfig.get( rteEditor );

			expect( config.placeholder ).to.be.null;
		} );

		describe( 'mentions.feeds', () => {
			it( 'should retrieve urls from the dom', () => {
				const textExpander = GitHubPage.appendElementHtml(
					'<text-expander' +
					' data-issue-url="/test-issues"' +
					' data-mention-url="/test-mentions"' +
					' data-emoji-url="/test-emojis"' +
					'></text-expander>' );

				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot( { target: textExpander } ) ) );

				const spy = sinon.spy( RteEditorConfigMentions, 'get' );

				RteEditorConfig.get( rteEditor );

				expect( spy.callCount ).to.equals( 1 );
				expect( spy.args[ 0 ][ 0 ].issues ).to.equals( '/test-issues' );
				expect( spy.args[ 0 ][ 0 ].people ).to.equals( '/test-mentions' );
				expect( spy.args[ 0 ][ 0 ].emoji ).to.equals( '/test-emojis' );
			} );

			it( 'should retrieve default if no urls in the dom', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );

				const spy = sinon.spy( RteEditorConfigMentions, 'get' );

				RteEditorConfig.get( rteEditor );

				expect( spy.callCount ).to.equals( 1 );
				expect( spy.args[ 0 ][ 0 ].issues ).to.be.undefined;
				expect( spy.args[ 0 ][ 0 ].people ).to.be.undefined;
				expect( spy.args[ 0 ][ 0 ].emoji ).to.equals( '/autocomplete/emoji' );
			} );
		} );

		describe( 'githubRte.upload', () => {
			it( 'should retrieve urls from the dom', () => {
				const uploadElement = GitHubPage.appendElementHtml(
					'<div' +
					' data-upload-policy-url="/test-upload"' +
					' data-upload-policy-authenticity-token="token"' +
					' data-upload-repository-id="repo_id"' +
					'></div>' );

				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot( { target: uploadElement } ) ) );

				const config = RteEditorConfig.get( rteEditor );
				expect( config.githubRte.upload ).to.be.a( 'function' );

				const promise = config.githubRte.upload();
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

				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot( { target: uploadElement } ) ) );

				const config = RteEditorConfig.get( rteEditor );
				expect( config.githubRte.upload ).to.be.a( 'function' );

				const promise = config.githubRte.upload();
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

				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot( { type: 'wiki' } ) ) );

				const config = RteEditorConfig.get( rteEditor );
				expect( config.githubRte.upload ).to.be.a( 'function' );

				const promise = config.githubRte.upload();
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

				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot( { target: uploadElement } ) ) );

				const config = RteEditorConfig.get( rteEditor );
				expect( config.githubRte.upload ).to.be.a( 'function' );

				const promise = config.githubRte.upload();
				expect( promise ).to.be.an.instanceOf( Promise );

				expect( config.githubRte.upload() ).to.be.equals( promise );
			} );
		} );

		describe( 'githubRte.autoLinking', () => {
			it( 'should have all features enabled in comment pages', () => {
				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );
				const config = RteEditorConfig.get( rteEditor );

				expect( config.githubRte.autoLinking ).to.eql( {
					person: true,
					issue: true,
					sha: true,
					urlGitHub: true,
					url: true
				} );
			} );

			it( 'should enable just url in wiki page', () => {
				GitHubPage.setPageName( 'repo_wiki' );

				const rteEditor = new RteEditor( new Editor( GitHubPage.appendRoot() ) );
				const config = RteEditorConfig.get( rteEditor );

				expect( config.githubRte.autoLinking ).to.eql( {
					person: false,
					issue: false,
					sha: false,
					urlGitHub: false,
					url: true
				} );
			} );
		} );

		describe( 'githubRte.suggestion.enabled', () => {
			it( 'should check if suggestion is enabled in the markdown editor', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const rteEditor = new RteEditor( editor );

				editor.markdownEditor.dom.toolbar.insertAdjacentHTML( 'beforeend',
					'<button class="js-suggested-change-toolbar-item">Suggestion</button>' );

				const config = RteEditorConfig.get( rteEditor );
				expect( config.githubRte.suggestion.enabled ).to.be.true;
			} );

			it( 'should check if suggestion is not enabled in the markdown editor', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const rteEditor = new RteEditor( editor );

				const config = RteEditorConfig.get( rteEditor );
				expect( config.githubRte.suggestion.enabled ).to.be.false;
			} );

			it( 'should add a button to the toolbar if enabled', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const rteEditor = new RteEditor( editor );

				editor.markdownEditor.dom.toolbar.insertAdjacentHTML( 'beforeend',
					'<button class="js-suggested-change-toolbar-item">Suggestion</button>' );

				const config = RteEditorConfig.get( rteEditor );
				expect( config.toolbar[ 0 ] ).to.equals( 'suggestion' );
				expect( config.toolbar[ 1 ] ).to.equals( '|' );
			} );
		} );

		describe( 'githubRte.savedReplies.url', () => {
			it( 'should take the url from the dom', () => {
				const editor = new Editor( GitHubPage.appendRoot() );
				const rteEditor = new RteEditor( editor );

				editor.markdownEditor.dom.toolbar.insertAdjacentHTML( 'beforeend',
					'<details-menu class="js-saved-reply-menu" src="https://test.com/sr">Saved Replies</details-menu>' );

				const config = RteEditorConfig.get( rteEditor );
				expect( config.githubRte.savedReplies.url ).to.equals( 'https://test.com/sr' );
			} );
		} );
	} );
} );
