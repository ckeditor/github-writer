/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import AutoLinking from '../../../../src/app/plugins/autolinking';

import { getData as getViewData } from '@ckeditor/ckeditor5-engine/src/dev-utils/view';
import { createTestEditor } from '../../../_util/ckeditor';
import { createElementFromHtml } from '../../../../src/app/util';

describe( 'Plugins', () => {
	describe( 'AutoLinking', () => {
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
					return createTestEditor( '', [ AutoLinking ] )
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
								'data-enabled="true" ' +
								`data-text="${ test.toLowerCase() }" ` +
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
					return createTestEditor( '', [ AutoLinking ] )
						.then( ret => ( { editor } = ret ) );
				} );

				after( 'cleanup test editor', () => {
					editor.destroy();
				} );
			}

			const validTests = {
				person: [
					'@user'
				],
				issue: [
					'#1',
					'https://github.com/org/repo/issues/1'
				],
				sha: [
					'16c999e',
					'https://github.com/org/repo/commit/abcde123'
				],
				url: [
					'https://test.com'
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
								'data-enabled="true" ' +
								`data-text="${ test.toLowerCase() }" ` +
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
					return createTestEditor( '', [ AutoLinking ] )
						.then( ret => ( { editor } = ret ) );
				} );

				after( 'cleanup test editor', () => {
					editor.destroy();
				} );
			}

			const validTests = {
				person: [
					'@user',
					'@UsEr',
					'@Org-Name/User-Name' ],
				issue: [
					'#1',
					'org-name/repo-name#1234',
					'https://github.com/org/repo/issues/1' ],
				sha: [
					'16c999e8c71134401a',
					'16c999e',
					'https://github.com/org/repo/commit/abcde123' ]
			};

			for ( const [ type, tests ] of Object.entries( validTests ) ) {
				tests.forEach( test => {
					it( `should refuse auto-link (${ test })`, done => {
						editor.setData( `Test ${ test } should refuse to auto-link.` );

						xhr.respond( 200, { 'Content-Type': 'text/html' },
							`<p>${ test }</p>` );

						setTimeout( () => {
							expect( getViewData( editor.editing.view, { withoutSelection: true } ) ).to.equal(
								'<p>' +
								'Test ' +
								'<autolink ' +
								'data-enabled="false" ' +
								`data-text="${ test }" ` +
								`data-type="${ type }">` +
								test +
								'</autolink>' +
								' should refuse to auto-link.' +
								'</p>' );

							expect( editor.getData() ).to.equals( `Test ${ test } should refuse to auto-link.` );

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
					return createTestEditor( '', [ AutoLinking ] )
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
