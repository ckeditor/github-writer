/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * These tests cover the AutoLinkUrl and AutoLinkGitHub plugins.
 */

import AutoLinkGitHub from '../../../src/app/plugins/autolinkgithub';
import AutoLinkUrl from '../../../src/app/plugins/autolinkurl';

import { getData as getViewData } from '@ckeditor/ckeditor5-engine/src/dev-utils/view';
import { createTestEditor } from '../../_util/ckeditor';
import { createElementFromHtml } from '../../../src/app/modules/util';

describe( 'Plugins', () => {
	describe( 'AutoLink (GitHub + Url)', () => {
		let xhr;

		{
			let element;

			before( 'create the necessary dom elements', () => {
				element = createElementFromHtml( `
				<form data-preview-url="https://preview/test">
					<input class="js-data-preview-url-csrf" value="the-token">
				</form>
			` );

				document.body.insertBefore( element, document.body.firstChild );
			} );

			after( 'cleanup element', () => {
				element.remove();
				element = null;
			} );
		}

		{
			beforeEach( 'stub XMLHttpRequest', () => {
				const sinonXhr = sinon.useFakeXMLHttpRequest();
				sinonXhr.onCreate = createdXhr => ( xhr = createdXhr );
				xhr = null;
			} );
		}

		describe( 'valid auto-links', () => {
			let editor;

			{
				before( 'create test editor', () => {
					return createTestEditor( '', [ AutoLinkGitHub, AutoLinkUrl ], {
						githubWriter: {
							autoLinking: {
								person: true,
								issue: true,
								sha: true,
								urlGitHub: true,
								url: true
							}
						}
					} )
						.then( ret => ( { editor } = ret ) );
				} );

				after( 'cleanup test editor', () => {
					editor.destroy();
				} );
			}

			const validTests = {
				person: [
					'@user',
					'@user1',
					'@user-name',
					'@UsEr',
					'@org/user',
					'@org/user1',
					'@org-name/user-name',
					'@org-name/user-name1',
					'@Org-Name/User-Name' ],
				issue: [
					'#1',
					'#1234',
					'org/repo#1',
					'org/repo#1234',
					'org-name/repo-name#1',
					'org-name/repo-name#1234',
					'https://github.com/org/repo/issues/1',
					'https://github.com/org/repo/pull/1'
				],
				sha: [
					'16c999e8c71134401a78d4d46435517b2271d6ac',
					'16c999e8c71134401a',
					'16c999e',
					'org/repo@16c999e8c71134401a78d4d46435517b2271d6ac',
					'org/repo@16c999e8c71134401a',
					'org/repo@16c999e',
					'org-name/repo-name@16c999e8c71134401a78d4d46435517b2271d6ac',
					'org-name/repo-name@16c999e8c71134401a',
					'org-name/repo-name@16c999e',
					'https://github.com/org/repo/commit/abcde123'
				],
				url: [
					'http://test.com',
					'https://test.com',
					'https://test.com/path',
					'https://test.com/path/',
					'https://test.com/path/path',
					'https://test.com?x',
					'https://test.com?x=1',
					'https://test.com?x=1&y=2'
				]
			};

			for ( const [ type, tests ] of Object.entries( validTests ) ) {
				tests.forEach( test => {
					it( `should auto-link (${ test })`, done => {
						editor.setData( `Test ${ test } should auto-link.` );

						if ( type !== 'url' ) {
							xhr.respond( 200, { 'Content-Type': 'text/html' },
								`<p><a href="/test/${ test.toLowerCase() }">${ test.toLowerCase() }</a></p>` );
						}

						setTimeout( () => {
							expect( getViewData( editor.editing.view, { withoutSelection: true } ) ).to.equal(
								'<p>' +
								'Test ' +
								'<autolink ' +
								`data-type="${ type }" ` +
								( type === 'url' ? `data-url="${ test.toLowerCase() }" ` :
									`data-url="/test/${ test.toLowerCase() }" ` ) +
								'spellcheck="false">' +
								test.toLowerCase() +
								'</autolink>' +
								' should auto-link.' +
								'</p>' );

							expect( editor.getData() ).to.equals( `Test ${ test.toLowerCase() } should auto-link.` );

							done();
						}, 0 );
					} );
				} );
			}
		} );

		describe( 'valid auto-links followed by punctuation', () => {
			let editor;

			{
				before( 'create test editor', () => {
					return createTestEditor( '', [ AutoLinkGitHub, AutoLinkUrl ], {
						githubWriter: {
							autoLinking: {
								person: true,
								issue: true,
								sha: true,
								urlGitHub: true,
								url: true
							}
						}
					} )
						.then( ret => ( { editor } = ret ) );
				} );

				after( 'cleanup test editor', () => {
					editor.destroy();
				} );
			}

			const validTests = {
				person: [
					'@userx'
				],
				issue: [
					'#10',
					'https://github.com/org/repo/issues/10'
				],
				sha: [
					'16c999ea',
					'https://github.com/org/repo/commit/abcde123a'
				],
				url: [
					'https://testx.com'
				]
			};

			for ( const [ type, tests ] of Object.entries( validTests ) ) {
				tests.forEach( test => {
					it( `should auto-link (${ test }) followed by punctuation`, done => {
						editor.setData( `Test ${ test }. Should auto-link.` );

						if ( type !== 'url' ) {
							xhr.respond( 200, { 'Content-Type': 'text/html' },
								`<p><a href="/test/${ test.toLowerCase() }">${ test.toLowerCase() }</a></p>` );
						}

						setTimeout( () => {
							expect( getViewData( editor.editing.view, { withoutSelection: true } ) ).to.equal(
								'<p>' +
								'Test ' +
								'<autolink ' +
								`data-type="${ type }" ` +
								( type === 'url' ? `data-url="${ test.toLowerCase() }" ` :
									`data-url="/test/${ test.toLowerCase() }" ` ) +
								'spellcheck="false">' +
								test.toLowerCase() +
								'</autolink>' +
								'. Should auto-link.' +
								'</p>' );

							expect( editor.getData() ).to.equals( `Test ${ test.toLowerCase() }. Should auto-link.` );

							done();
						}, 0 );
					} );
				} );
			}
		} );

		describe( 'refused auto-links', () => {
			let editor;

			{
				before( 'create test editor', () => {
					return createTestEditor( '', [ AutoLinkGitHub ], {
						githubWriter: {
							autoLinking: {
								person: true,
								issue: true,
								sha: true,
								urlGitHub: true,
								url: true
							}
						}
					} )
						.then( ret => ( { editor } = ret ) );
				} );

				after( 'cleanup test editor', () => {
					editor.destroy();
				} );
			}

			const validTests = {
				person: [
					'@userz',
					'@UsErz',
					'@Org-Name/User-Namez' ],
				issue: [
					'#100',
					'org-name/repo-name#123400',
					'https://github.com/org/repo/issues/1000' ],
				sha: [
					'16c999e8c71134401bb',
					'16c999bb',
					'https://github.com/org/repo/commit/abcde123bbb' ]
			};

			for ( const [ , tests ] of Object.entries( validTests ) ) {
				tests.forEach( test => {
					it( `should refuse auto-link (${ test })`, done => {
						editor.setData( `Test ${ test } should refuse to auto-link.` );

						xhr.respond( 200, { 'Content-Type': 'text/html' },
							`<p>${ test }</p>` );

						setTimeout( () => {
							expect( getViewData( editor.editing.view, { withoutSelection: true } ) ).to.equal(
								'<p>' +
								`Test ${ test } should refuse to auto-link.` +
								'</p>' );

							expect( editor.getData() ).to.equals( `Test ${ test } should refuse to auto-link.` );

							done();
						}, 0 );
					} );
				} );
			}
		} );

		describe( 'fallback to ur on refused GH url auto-links', () => {
			let editor;

			{
				before( 'create test editor', () => {
					return createTestEditor( '', [ AutoLinkGitHub, AutoLinkUrl ], {
						githubWriter: {
							autoLinking: {
								person: true,
								issue: true,
								sha: true,
								urlGitHub: true,
								url: true
							}
						}
					} )
						.then( ret => ( { editor } = ret ) );
				} );

				after( 'cleanup test editor', () => {
					editor.destroy();
				} );
			}

			const validTests = {
				issue: [ 'https://github.com/org/repo/issues/10000' ],
				sha: [ 'https://github.com/org/repo/commit/abcde123bbbb' ]
			};

			for ( const [ , tests ] of Object.entries( validTests ) ) {
				tests.forEach( test => {
					it( `should fallback to url when refuse GH url auto-link (${ test })`, done => {
						editor.setData( `Test ${ test } should auto-link.` );

						xhr.respond( 200, { 'Content-Type': 'text/html' },
							`<p>${ test }</p>` );

						setTimeout( () => {
							expect( getViewData( editor.editing.view, { withoutSelection: true } ) ).to.equal(
								'<p>' +
								'Test ' +
								'<autolink ' +
								`data-type="url" ` +
								`data-url="${ test.toLowerCase() }" ` +
								'spellcheck="false">' +
								test.toLowerCase() +
								'</autolink>' +
								' should auto-link.' +
								'</p>' );

							expect( editor.getData() ).to.equals( `Test ${ test } should auto-link.` );

							done();
						}, 0 );
					} );
				} );
			}
		} );

		describe( 'invalid auto-links', () => {
			let editor;

			{
				before( 'create test editor', () => {
					return createTestEditor( '', [ AutoLinkGitHub, AutoLinkUrl ], {
						githubWriter: {
							autoLinking: {
								person: true,
								issue: true,
								sha: true,
								urlGitHub: true,
								url: true
							}
						}
					} )
						.then( ret => ( { editor } = ret ) );
				} );

				after( 'cleanup test editor', () => {
					editor.destroy();
				} );
			}

			const invalidTests = [
				'@@@',
				'@ user',
				'email@user',
				'@user--name',
				'@UsEr$$',
				'@org--name/user-name',

				'###',
				'# 1',
				'#1a',
				'org/repo#1234a',
				'org--name/repo-name#1',
				'org-name/repo--name#1234',

				'x16c999e8c71134401a78d4d46435517b2271d6a',		// non hexa
				'16c999e8c71134401a78d4d46435517b2271d6ac0', 	// 41 chars
				'x16c999e8c71134401a',							// non hexa
				'16c999',										// too short
				'org/repo@16c999e8c71134401a78d4d46435517b2271d6ac0',
				'org/repo@x16c999e8c71134401a',
				'org/repo@16c999',
				'org--name/repo-name@16c999e8c71134401a78d4d46435517b2271d6ac',
				'org-name/repo--name@16c999e8c71134401a'
			];

			invalidTests.forEach( test => {
				it( `should not auto-link (${ test })`, done => {
					const data = `Test ${ test } should not auto-link.`;
					editor.setData( data );

					expect( xhr ).to.be.null;

					setTimeout( () => {
						expect( getViewData( editor.editing.view, { withoutSelection: true } ) ).to.equal(
							`<p>${ data }</p>` );

						expect( editor.getData(), 'getData()' ).to.equals( data );

						done();
					}, 0 );
				} );
			} );
		} );
	} );
} );
