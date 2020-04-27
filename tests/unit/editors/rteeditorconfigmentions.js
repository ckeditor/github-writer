/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import RteEditorConfigMentions from '../../../src/app/editors/rteeditorconfigmentions';

import CKEditorGitHubEditor from '../../../src/app/editors/ckeditorgithubeditor';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import CodeEditing from '@ckeditor/ckeditor5-basic-styles/src/code/codeediting';
import CodeBlockEditing from '@ckeditor/ckeditor5-code-block/src/codeblockediting';

describe( 'Editors', () => {
	describe( 'RteEditorConfigMentions', () => {
		let xhr;

		beforeEach( () => {
			xhr = null;
			const sinonXhr = sinon.useFakeXMLHttpRequest();
			sinonXhr.onCreate = createdXhr => ( xhr = createdXhr );
		} );

		it( 'should return feeds configuration', () => {
			const config = RteEditorConfigMentions.get( {
				issues: '/test-issues',
				people: '/test-mentions',
				emoji: '/test-emojis'
			} );

			expect( config ).to.be.an( 'array' ).length( 3 );

			config.forEach( feedConfig => {
				expect( feedConfig.marker ).to.be.oneOf( [ '#', '@', ':' ] );
				expect( feedConfig.feed ).to.be.a( 'function' );
				expect( feedConfig.itemRenderer ).to.be.a( 'function' );
			} );
		} );

		[
			{ marker: '#', urls: { issues: '/test-issues' } },
			{ marker: '@', urls: { people: '/test-mentions' } },
			{ marker: ':', urls: { emoji: '/test-emojis' } }
		].forEach( entry => {
			it( `should return single feeds configuration (${ entry.marker })`, () => {
				const config = RteEditorConfigMentions.get( entry.urls );

				expect( config ).to.be.an( 'array' ).length( 1 );

				expect( config[ 0 ].marker ).to.equals( entry.marker );
				expect( config[ 0 ].feed ).to.be.a( 'function' );
				expect( config[ 0 ].itemRenderer ).to.be.a( 'function' );
			} );
		} );

		describe( 'issues', () => {
			it( 'should return proper results', () => {
				const config = RteEditorConfigMentions.get( {
					issues: '/test-issues'
				} );

				const promise = config[ 0 ].feed.call( new CKEditorGitHubEditor(), '' );
				expect( promise ).to.be.an.instanceOf( Promise );

				xhr.respond( 200, { 'Content-Type': 'application/json' }, JSON.stringify( {
					suggestions: [
						{ id: 101, number: 1, title: 'Test 1' },
						{ id: 102, number: 2, title: 'Test 2' },
						{ id: 103, number: 3, title: 'Test 3' }
					]
				} ) );

				return promise.then( results => {
					expect( results ).to.eql( [
						{ id: '#1', number: 1, title: 'Test 1' },
						{ id: '#2', number: 2, title: 'Test 2' },
						{ id: '#3', number: 3, title: 'Test 3' }
					] );
				} );
			} );

			it( 'should render an entry', () => {
				const config = RteEditorConfigMentions.get( {
					issues: '/test-issues'
				} );

				const element = config[ 0 ].itemRenderer( { id: '#1', number: 1, title: 'Test 1' } );

				expect( element ).to.be.an.instanceOf( HTMLButtonElement );
			} );

			it( 'should escape html in the title', () => {
				const config = RteEditorConfigMentions.get( {
					issues: '/test-issues'
				} );

				const element = config[ 0 ].itemRenderer( { id: '#1', number: 1, title: 'Test <a href="x">html</a>' } );

				expect( element.innerHTML.trim() ).to.equals( '<small>#1</small> Test &lt;a href="x"&gt;html&lt;/a&gt;' );
			} );
		} );

		describe( 'people', () => {
			it( 'should return proper results', () => {
				const config = RteEditorConfigMentions.get( {
					people: '/test-mentions'
				} );

				const promise = config[ 0 ].feed.call( new CKEditorGitHubEditor(), '' );
				expect( promise ).to.be.an.instanceOf( Promise );

				xhr.respond( 200, { 'Content-Type': 'application/json' }, JSON.stringify( [
					{ type: 'user', id: 101, login: 'user_1', name: 'User 1' },
					{ type: 'user', id: 102, login: 'user_2', name: 'User 2' },
					{ type: 'user', id: 103, login: 'user_3', name: 'User 3' }
				] ) );

				return promise.then( results => {
					expect( results ).to.eql( [
						{ description: 'User 1', id: '@user_1', name: 'user_1' },
						{ description: 'User 2', id: '@user_2', name: 'user_2' },
						{ description: 'User 3', id: '@user_3', name: 'user_3' }
					] );
				} );
			} );

			it( 'should return proper results with team included', () => {
				const config = RteEditorConfigMentions.get( {
					people: '/test-mentions'
				} );

				const promise = config[ 0 ].feed.call( new CKEditorGitHubEditor(), '' );
				expect( promise ).to.be.an.instanceOf( Promise );

				xhr.respond( 200, { 'Content-Type': 'application/json' }, JSON.stringify( [
					{ type: 'user', id: 101, login: 'user_1', name: 'User 1' },
					{ type: 'team', id: 202, name: 'org/team', description: 'Team 2' },
					{ type: 'user', id: 103, login: 'user_3', name: 'User 3' }
				] ) );

				return promise.then( results => {
					expect( results ).to.eql( [
						{ description: 'User 1', id: '@user_1', name: 'user_1' },
						{ description: 'Team 2', id: '@org/team', name: 'org/team' },
						{ description: 'User 3', id: '@user_3', name: 'user_3' }
					] );
				} );
			} );

			it( 'should default on missing data', () => {
				const config = RteEditorConfigMentions.get( {
					people: '/test-mentions'
				} );

				const promise = config[ 0 ].feed.call( new CKEditorGitHubEditor(), '' );
				expect( promise ).to.be.an.instanceOf( Promise );

				xhr.respond( 200, { 'Content-Type': 'application/json' }, JSON.stringify( [
					{ type: 'user', id: 101, login: 'user_1' },
					{ type: 'team', id: 202, name: 'org/team' },
					{ type: 'user', id: 103, login: 'user_3', name: 'User 3' }
				] ) );

				return promise.then( results => {
					expect( results ).to.eql( [
						{ description: '', id: '@user_1', name: 'user_1' },
						{ description: '', id: '@org/team', name: 'org/team' },
						{ description: 'User 3', id: '@user_3', name: 'user_3' }
					] );
				} );
			} );

			it( 'should ignore missing name', () => {
				const config = RteEditorConfigMentions.get( {
					people: '/test-mentions'
				} );

				const promise = config[ 0 ].feed.call( new CKEditorGitHubEditor(), '' );
				expect( promise ).to.be.an.instanceOf( Promise );

				xhr.respond( 200, { 'Content-Type': 'application/json' }, JSON.stringify( [
					{ type: 'user', id: 101, login: 'user_1', name: 'User 1' },
					{ type: 'test', id: 102, login: 'test', name: 'Testßß' },
					{ type: 'team', id: 202, name: 'org/team', description: 'Team 2' },
					{ type: 'user', id: 103, login: 'user_3', name: 'User 3' }
				] ) );

				return promise.then( results => {
					expect( results ).to.eql( [
						{ description: 'User 1', id: '@user_1', name: 'user_1' },
						{ description: 'Team 2', id: '@org/team', name: 'org/team' },
						{ description: 'User 3', id: '@user_3', name: 'user_3' }
					] );
				} );
			} );

			it( 'should ignore unknown types', () => {
				const config = RteEditorConfigMentions.get( {
					people: '/test-mentions'
				} );

				const promise = config[ 0 ].feed.call( new CKEditorGitHubEditor(), '' );
				expect( promise ).to.be.an.instanceOf( Promise );

				xhr.respond( 200, { 'Content-Type': 'application/json' }, JSON.stringify( [
					{ type: 'user', id: 101, name: 'User 1' },
					{ type: 'team', id: 202, description: 'Team 2' },
					{ type: 'user', id: 103, login: 'user_3', name: 'User 3' }
				] ) );

				return promise.then( results => {
					expect( results ).to.eql( [
						{ description: 'User 3', id: '@user_3', name: 'user_3' }
					] );
				} );
			} );

			it( 'should render an entry', () => {
				const config = RteEditorConfigMentions.get( {
					people: '/test-mentions'
				} );

				const element = config[ 0 ].itemRenderer( { description: 'User 1', id: '@user_1', name: 'user_1' } );

				expect( element ).to.be.an.instanceOf( HTMLButtonElement );
			} );

			it( 'should escape html in the id and name', () => {
				const config = RteEditorConfigMentions.get( {
					people: '/test-mentions'
				} );

				const element = config[ 0 ].itemRenderer( {
					description: 'User <a href="x">description</a>',
					id: '@user_<a href="x">id</a>',
					name: 'user_<a href="y">name</a>'
				} );

				expect( element.innerHTML.trim() )
					.to.equals( 'user_&lt;a href="y"&gt;name&lt;/a&gt; <small>User &lt;a href="x"&gt;description&lt;/a&gt;</small>' );
			} );
		} );

		describe( 'emoji', () => {
			it( 'should return proper results', () => {
				const config = RteEditorConfigMentions.get( {
					emoji: [
						{ name: 'emoji1', url: 'url1', aka: 'the1', unicode: '😀' },
						{ name: 'emoji2', url: 'url2', aka: 'the2' },
						{ name: 'emoji3', url: 'url3' }
					]
				} );

				const promise = config[ 0 ].feed.call( new CKEditorGitHubEditor(), '' );
				expect( promise ).to.be.an.instanceOf( Promise );

				return promise.then( results => {
					expect( results ).to.eql( [
						{ id: ':emoji1:', name: 'emoji1', unicode: '😀', url: 'url1' },
						{ id: ':emoji2:', name: 'emoji2', unicode: undefined, url: 'url2' },
						{ id: ':emoji3:', name: 'emoji3', unicode: undefined, url: 'url3' }
					] );
				} );
			} );

			it( 'should render an unicode entry', () => {
				const config = RteEditorConfigMentions.get( {
					emoji: '/test-emoji'
				} );

				const element = config[ 0 ].itemRenderer( {
					id: ':emoji1:',
					name: 'emoji1',
					url: 'url1',
					unicode: '😀'
				} );

				expect( element ).to.be.an.instanceOf( HTMLButtonElement );

				expect( element.innerHTML.trim() )
					.to.equals( '<g-emoji alias="emoji1" fallback-src="url1" class="emoji-result" tone="0">😀</g-emoji> emoji1' );
			} );

			it( 'should render an non-unicode entry', () => {
				const config = RteEditorConfigMentions.get( {
					emoji: '/test-emoji'
				} );

				const element = config[ 0 ].itemRenderer( { id: ':emoji1:', name: 'emoji1', url: 'url1' } );

				expect( element ).to.be.an.instanceOf( HTMLButtonElement );

				expect( element.innerHTML.trim() )
					.to.match( /<img.* alt=":emoji1:".* src="url1".*> emoji1/ );
			} );
		} );

		describe( 'find()', () => {
			it( 'should do nothing when inside inline code', () => {
				const config = RteEditorConfigMentions.get( {
					issues: '/test-issues'
				} );

				return CKEditorGitHubEditor.create( '', { plugins: [ CodeEditing ] } )
					.then( editor => {
						editor.execute( 'code' );

						const promise = config[ 0 ].feed.call( editor, '' );
						expect( promise ).to.be.an.instanceOf( Promise );

						expect( xhr ).to.be.null;

						return promise.then( results => {
							expect( results ).to.eql( [] );

							return editor.destroy(); // Test cleanup.
						} );
					} );
			} );

			it( 'should do nothing when inside block code', () => {
				const config = RteEditorConfigMentions.get( {
					issues: '/test-issues'
				} );

				return CKEditorGitHubEditor.create( '', { plugins: [ Paragraph, CodeBlockEditing ] } )
					.then( editor => {
						editor.execute( 'codeBlock' );

						const promise = config[ 0 ].feed.call( editor, '' );
						expect( promise ).to.be.an.instanceOf( Promise );

						expect( xhr ).to.be.null;

						return promise.then( results => {
							expect( results ).to.eql( [] );

							return editor.destroy(); // Test cleanup.
						} );
					} );
			} );

			it( 'should return the same results (===) on second call', () => {
				const config = RteEditorConfigMentions.get( {
					issues: '/test-issues'
				} );

				const feed = config[ 0 ].feed.bind( new CKEditorGitHubEditor() );

				const promise = feed( 'Test' );
				expect( promise ).to.be.an.instanceOf( Promise );

				xhr.respond( 200, { 'Content-Type': 'application/json' }, JSON.stringify( {
					suggestions: [
						{ id: 101, number: 1, title: 'Test 1' },
						{ id: 102, number: 2, title: 'Test 2' },
						{ id: 103, number: 3, title: 'Test 3' }
					]
				} ) );

				return promise.then( () => {
					expect( feed( 'Test' ) ).to.equals( promise );
				} );
			} );

			it( 'should not download again on second call and different query', () => {
				const config = RteEditorConfigMentions.get( {
					issues: '/test-issues'
				} );

				const feed = config[ 0 ].feed.bind( new CKEditorGitHubEditor() );

				const promise = feed( 'Test' );

				xhr.respond( 200, { 'Content-Type': 'application/json' }, JSON.stringify( {
					suggestions: [
						{ id: 101, number: 1, title: 'Test 1' },
						{ id: 102, number: 2, title: 'Test 2' },
						{ id: 103, number: 3, title: 'Test 3' }
					]
				} ) );

				return promise.then( () => {
					xhr = null;

					const promise = feed( '1' );
					expect( promise ).to.be.an.instanceOf( Promise );

					expect( xhr ).to.be.null;
				} );
			} );

			it( 'should reject if no data received', done => {
				const config = RteEditorConfigMentions.get( {
					issues: '/test-issues'
				} );

				const promise = config[ 0 ].feed.call( new CKEditorGitHubEditor(), '' );
				expect( promise ).to.be.an.instanceOf( Promise );

				xhr.respond( 200, { 'Content-Type': 'application/json' }, '' );

				promise
					.catch( err => {
						expect( err ).to.be.an.instanceOf( Error );
						done();
					} );
			} );

			it( 'should reject on xhr error', done => {
				const config = RteEditorConfigMentions.get( {
					issues: '/test-issues'
				} );

				const promise = config[ 0 ].feed.call( new CKEditorGitHubEditor(), '' );
				expect( promise ).to.be.an.instanceOf( Promise );

				xhr.error();

				promise
					.catch( err => {
						expect( err ).to.be.an.instanceOf( Error );
						done();
					} );
			} );

			it( 'should reject on xhr abort', done => {
				const config = RteEditorConfigMentions.get( {
					issues: '/test-issues'
				} );

				const promise = config[ 0 ].feed.call( new CKEditorGitHubEditor(), '' );
				expect( promise ).to.be.an.instanceOf( Promise );

				xhr.abort();

				promise
					.catch( err => {
						expect( err ).to.be.undefined;
						done();
					} );
			} );

			// In these tests, not only the results must be correct but also ordered as expected.
			[
				{ query: 'est', results: [ 203, 102, 101 ] },
				{ query: 'ext', results: [ 204, 203 ] },
				{ query: 'a4e', results: [ 204 ] },
				{ query: '1', results: [ 101, 102 ] },
				{ query: '20', results: [ 203, 204 ] },
				{ query: '2034', results: [] },
				{ query: '205', results: [] },
				{ query: 'esta', results: [] }
			].forEach( entry => {
				it( `should return proper results for a query (${ entry.query })`, () => {
					const config = RteEditorConfigMentions.get( {
						issues: '/test-issues'
					} );

					const promise = config[ 0 ].feed.call( new CKEditorGitHubEditor(), entry.query );
					expect( promise ).to.be.an.instanceOf( Promise );

					xhr.respond( 200, { 'Content-Type': 'application/json' }, JSON.stringify( {
						suggestions: [
							{ id: 204, number: 204, title: 'Another 4 Ext' },
							{ id: 203, number: 203, title: 'Test 3 Ext' },
							{ id: 102, number: 102, title: 'Test 2' },
							{ id: 101, number: 101, title: 'Test 1' }
						]
					} ) );

					return promise.then( results => {
						// Compare the returned numbers with the expected results.
						expect( results.map( returnEntry => returnEntry.number ) ).to.eql( entry.results );
					} );
				} );
			} );
		} );
	} );
} );
