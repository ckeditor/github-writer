/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import PageManager from '../../src/app/pagemanager';
import Editor from '../../src/app/editor';
import { PageIncompatibilityError } from '../../src/app/util';

import { GitHubPage } from '../_util/githubpage';

describe( 'PageManager', () => {
	beforeEach( () => {
		// We don't care about the proper editor creation in the tests here.
		sinon.stub( Editor.prototype, 'create' ).callsFake( function() {
			return Promise.resolve( this );
		} );

		// Same for destroy.
		sinon.stub( Editor.prototype, 'destroy' );
	} );

	function failOnCatch( err ) {
		expect.fail( err.message + '\n' + err.stack );
	}

	describe( 'constructor()', () => {
		it( 'should detect missing page name', () => {
			GitHubPage.reset();

			const pageMananger = new PageManager();

			expect( pageMananger.page ).to.equals( 'unknown' );
		} );

		it( 'should detect the page name', () => {
			const pageMananger = new PageManager();

			expect( pageMananger.page ).to.equals( 'repo_issue' );
		} );

		it( 'should detect the page type', () => {
			const pageMananger = new PageManager();

			expect( pageMananger.type ).to.equals( 'comments' );
		} );

		it( 'should detect a wiki page type', () => {
			GitHubPage.setPageName( 'repo_wiki' );

			const pageMananger = new PageManager();

			expect( pageMananger.type ).to.equals( 'wiki' );
		} );
	} );

	describe( 'addClickListener()', () => {
		it( 'should call listeners', () => {
			const button1 = GitHubPage.appendElementHtml(
				'<button class="test-button">Test <span>text</span></button>' );
			const button2 = GitHubPage.appendElementHtml(
				'<button class="test-button">Test <span>text</span></button>' );
			const button3 = GitHubPage.appendElementHtml(
				'<button class="test-button-other">Test <span>text</span></button>' );

			const callback = sinon.spy();

			const pageManager = new PageManager();
			pageManager.addClickListener( '.test-button', callback );
			pageManager.addClickListener( '.test-button-other', callback );

			button1.click();
			expect( callback.calledOnce, 'button click' ).to.be.true;

			button1.querySelector( 'span' ).click();
			expect( callback.calledTwice, 'inner click' ).to.be.true;

			button2.click();
			expect( callback.callCount, 'button click 2' ).to.equals( 3 );

			button2.querySelector( 'span' ).click();
			expect( callback.callCount, 'inner click 2' ).to.equals( 4 );

			button3.click();
			expect( callback.callCount, 'button click 3' ).to.equals( 5 );

			button3.querySelector( 'span' ).click();
			expect( callback.callCount, 'inner click 3' ).to.equals( 6 );
		} );

		it( 'should not call listeners on other elements click', () => {
			const buttonA = GitHubPage.appendElementHtml(
				'<button class="test-button-A">Test <span>text</span></button>' );

			const buttonB = GitHubPage.appendElementHtml(
				'<button class="test-button-B">Test <span>text</span></button>' );

			const callback = sinon.spy();

			const pageManager = new PageManager();
			pageManager.addClickListener( '.test-button-A', callback );

			buttonB.click();
			buttonB.querySelector( 'span' ).click();
			expect( callback.notCalled, 'button A' ).to.be.true;

			buttonA.click();
			buttonA.querySelector( 'span' ).click();
			expect( callback.calledTwice, 'button B' ).to.be.true;
		} );
	} );

	describe( 'init()', () => {
		[ 'edit', 'pr-inline-comment', 'code-line-comment' ].forEach( type => {
			it( `should watch buttons (${ type })`, () => {
				Editor.prototype.create.restore();

				const pageManager = new PageManager();
				pageManager.init();

				const { button, root } = GitHubPage.appendButton( { type } );

				const spy = sinon.spy( pageManager, 'setupEditor' );
				expect( spy.called, 'no call before' ).to.be.false;

				button.click();

				expect( spy.calledOnce, 'one call after' ).to.be.true;
				expect( spy.firstCall.calledWith( root ) ).to.be.true;
			} );
		} );

		it( 'should click the write tab after creation (code line editor)', done => {
			const pageManager = new PageManager();
			pageManager.init();

			const { button } = GitHubPage.appendButton( { type: 'code-line-comment' } );

			const writeTab = document.querySelector( '.write-tab' );
			const stub = writeTab.click; // Stubbed by GitHubPage.

			button.click();

			setTimeout( () => {
				expect( stub.called ).to.be.true;
				done();
			}, 0 );
		} );

		it( `should do nothing on action button without edit`, () => {
			const pageManager = new PageManager();
			pageManager.init();

			const { button } = GitHubPage.appendButton( { type: 'edit' } );

			button.parentElement.querySelector( '.js-comment-edit-button' ).remove();

			const stub = sinon.stub( pageManager, 'setupEditor' );
			expect( stub.called, 'no call before' ).to.be.false;

			button.click();

			expect( stub.called, 'no call after' ).to.be.false;
		} );

		it( 'should destroy editors before pjax', () => {
			const pageManager = new PageManager();
			pageManager.init();

			const stub = sinon.stub( pageManager, 'destroyEditors' );
			expect( stub.called, 'no call before' ).to.be.false;

			document.body.dispatchEvent( new CustomEvent( 'pjax:start', { bubbles: true } ) );

			expect( stub.calledOnce, 'one call after' ).to.be.true;
			expect( stub.firstCall.calledWith( document.body ) ).to.be.true;
		} );

		it( 'should re-scan after pjax', done => {
			const pageManager = new PageManager();
			pageManager.init();

			const stub = sinon.stub( pageManager, 'scan' );
			expect( stub.called, 'no call before' ).to.be.false;

			document.body.dispatchEvent( new CustomEvent( 'pjax:end', { bubbles: true } ) );

			setTimeout( () => {
				expect( stub.calledOnce, 'one call after' ).to.be.true;
				done();
			}, 1 );
		} );

		it( 'should bootstrap quote selection', () => {
			const pageManager = new PageManager();

			// Stubbed on before().
			const spy = sinon.spy( pageManager, 'setupQuoteSelection' );

			expect( spy.called, 'no call before' ).to.be.false;

			pageManager.init();

			expect( spy.calledOnce, 'one call after' ).to.be.true;
		} );

		it( 'should fire scan()', () => {
			const pageManager = new PageManager();

			// Stubbed on before().
			const stub = sinon.stub( pageManager, 'scan' );

			expect( stub.called, 'no call before' ).to.be.false;

			pageManager.init();

			expect( stub.calledOnce, 'one call after' ).to.be.true;
		} );
	} );

	describe( 'scan()', () => {
		it( 'should return a promise', () => {
			const pageManager = new PageManager();

			GitHubPage.appendRoot();

			const promise = pageManager.scan();

			expect( promise ).to.be.an.instanceOf( Promise );
			return promise
				.then( editors => {
					expect( editors ).to.be.an.instanceOf( Array );
					expect( editors.length ).to.equals( 1 );
					expect( editors[ 0 ] ).to.an.instanceOf( Editor );
				} )
				.catch( failOnCatch );
		} );

		it( 'should reject on error', () => {
			const pageManager = new PageManager();
			const root = GitHubPage.appendRoot();

			// Error caused by this.
			root.querySelector( 'textarea' ).remove();

			return pageManager.scan()
				.then( () => {
					expect.fail( 'the promise should reject' );
				} )
				.catch( err => {
					expect( err ).to.be.an.instanceOf( PageIncompatibilityError );
				} );
		} );

		it( 'should resolve to empty array', () => {
			const pageManager = new PageManager();

			const promise = pageManager.scan();

			expect( promise ).to.be.an.instanceOf( Promise );
			return promise
				.then( editors => {
					expect( editors ).to.be.an.instanceOf( Array );
					expect( editors.length ).to.equals( 0 );
				} )
				.catch( failOnCatch );
		} );

		[ 'issue', 'pull-request', 'comment', 'pull-request-review', 'wiki' ].forEach( type => {
			it( `should find main editor (${ type })`, () => {
				const pageManager = new PageManager();

				GitHubPage.appendRoot( { type } );

				const promise = pageManager.scan();

				expect( promise ).to.be.an.instanceOf( Promise );
				return promise
					.then( editors => {
						expect( editors ).to.be.an.instanceOf( Array );
						expect( editors.length ).to.equals( 1 );
						expect( editors[ 0 ] ).to.an.instanceOf( Editor );
					} )
					.catch( failOnCatch );
			} );
		} );

		it( 'should find comment editors', () => {
			const pageManager = new PageManager();

			// One main editor.
			GitHubPage.appendRoot();

			// Three comment editors.
			GitHubPage.appendRoot( { type: 'comment-edit' } );
			GitHubPage.appendRoot( { type: 'comment-code-line' } );
			GitHubPage.appendRoot( { type: 'comment-edit' } );

			const promise = pageManager.scan();

			expect( promise ).to.be.an.instanceOf( Promise );
			return promise
				.then( editors => {
					expect( editors ).to.be.an.instanceOf( Array );
					expect( editors.length ).to.equals( 4 );
					expect( editors[ 0 ] ).to.an.instanceOf( Editor );
					expect( editors[ 1 ] ).to.an.instanceOf( Editor );
					expect( editors[ 2 ] ).to.an.instanceOf( Editor );
					expect( editors[ 3 ] ).to.an.instanceOf( Editor );
				} )
				.catch( failOnCatch );
		} );
	} );

	describe( 'setupEditor()', () => {
		function failOnCatch( err ) {
			expect.fail( err.message + '\n' + err.stack );
		}

		it( 'should return a promise', () => {
			const pageManager = new PageManager();
			const root = GitHubPage.appendRoot();
			const editorPromise = pageManager.setupEditor( root );

			expect( editorPromise ).to.be.an.instanceOf( Promise );
			return editorPromise.catch( failOnCatch );
		} );

		it( 'should return the same promise when called again', () => {
			const pageManager = new PageManager();
			const root = GitHubPage.appendRoot();
			const editorPromise = pageManager.setupEditor( root );

			return editorPromise
				.then( () => {
					expect( pageManager.setupEditor( root ) ).to.equals( editorPromise );
				} )
				.catch( failOnCatch );
		} );

		it( 'should set the root id', () => {
			const pageManager = new PageManager();
			const root = GitHubPage.appendRoot();

			return pageManager.setupEditor( root )
				.then( editor => {
					expect( root.getAttribute( 'data-github-rte-id' ) ).to.equals( editor.id.toString() );
				} )
				.catch( failOnCatch );
		} );

		it( 'should reject on error', () => {
			const pageManager = new PageManager();
			const root = GitHubPage.appendRoot();

			// Error caused by this.
			root.querySelector( 'textarea' ).remove();

			return pageManager.setupEditor( root )
				.then( () => {
					expect.fail( 'the promise should reject' );
				} )
				.catch( err => {
					expect( err ).to.be.an.instanceOf( PageIncompatibilityError );
				} );
		} );

		it( 'should handle a dirty dom', () => {
			const pageManager = new PageManager();
			const root = GitHubPage.appendRoot();

			return pageManager.setupEditor( root )
				.then( editor => {
					const rootHtml = root.outerHTML;
					root.remove();
					const rootCopy = GitHubPage.appendElementHtml( rootHtml );

					expect( rootCopy.getAttribute( 'data-github-rte-id' ) )
						.to.equals( root.getAttribute( 'data-github-rte-id' ) );

					sinon.stub( Editor, 'cleanup' );

					return pageManager.setupEditor( rootCopy )
						.then( editorFromCopy => {
							expect( editorFromCopy.id ).to.be.greaterThan( editor.id );
							expect( Editor.cleanup.calledOnce ).to.be.true;
							expect( Editor.cleanup.firstCall.calledWithExactly( rootCopy ) ).to.be.true;
						} )
						.catch( failOnCatch );
				} )
				.catch( failOnCatch );
		} );

		it( 'should timeout (requestIdleCallback)', () => {
			const pageManager = new PageManager();
			const root = GitHubPage.appendRoot();

			expect( window ).to.have.property( 'requestIdleCallback' );

			const editorPromise = pageManager.setupEditor( root, true );

			expect( editorPromise ).to.be.an.instanceOf( Promise );

			const spy = sinon.spy( pageManager, 'setupEditor' );

			return editorPromise
				.then( () => {
					expect( spy.calledOnce, 'called once' ).to.be.true;
					expect( spy.firstCall.calledWithExactly( root ), 'called with root' ).to.be.true;
				} )
				.catch( failOnCatch );
		} );

		it( 'should timeout (setTimeout)', () => {
			const pageManager = new PageManager();
			const root = GitHubPage.appendRoot();

			const requestIdleCallback = window.requestIdleCallback;
			delete window.requestIdleCallback;

			expect( window ).to.not.have.property( 'requestIdleCallback' );

			const editorPromise = pageManager.setupEditor( root, true );

			expect( editorPromise ).to.be.an.instanceOf( Promise );

			const spy = sinon.spy( pageManager, 'setupEditor' );

			return editorPromise
				.then( () => {
					window.requestIdleCallback = requestIdleCallback;

					expect( spy.calledOnce, 'called once' ).to.be.true;
					expect( spy.firstCall.calledWithExactly( root ), 'called with root' ).to.be.true;
				} )
				.catch( failOnCatch );
		} );
	} );

	describe( 'destroyEditors()', () => {
		it( 'should destroy editors in a container', () => {
			const pageManager = new PageManager();

			// Append an editor in document.body.
			const bodyRoot = GitHubPage.appendRoot( { type: 'comment-edit' } );
			let bodyRootEditor;

			// Append two editors in a container.
			const container = GitHubPage.appendElementHtml( '<div></div>' );
			GitHubPage.appendRoot( { type: 'comment-edit', target: container } );
			GitHubPage.appendRoot( { type: 'comment-edit', target: container } );

			return pageManager.scan()
				.catch( failOnCatch )
				.then( editors => {
					expect( editors.length ).to.equals( 3 );

					bodyRootEditor = editors.find( editor => editor.dom.root === bodyRoot );

					return pageManager.destroyEditors( container );
				} )
				.then( () => {
					const spy = Editor.prototype.destroy;
					expect( spy.callCount ).to.equals( 2 );
					expect( spy.calledOn( bodyRootEditor ) ).to.be.false;
				} );
		} );

		it( 'should ignore destroyed editors', () => {
			const pageManager = new PageManager();

			// Append 3 editors in a container.
			const container = GitHubPage.appendElementHtml( '<div></div>' );
			GitHubPage.appendRoot( { type: 'comment-edit', target: container } );
			GitHubPage.appendRoot( { type: 'comment-edit', target: container } );
			GitHubPage.appendRoot( { type: 'comment-edit', target: container } );

			return pageManager.scan()
				.catch( failOnCatch )
				.then( () => {
					Editor.prototype.destroy.resetHistory();
					return pageManager.destroyEditors( container );
				} )
				.then( () => {
					expect( Editor.prototype.destroy.callCount ).to.equals( 3 );
					Editor.prototype.destroy.resetHistory();
					return pageManager.destroyEditors( container );
				} )
				.then( () => {
					expect( Editor.prototype.destroy.callCount ).to.equals( 0 );
				} );
		} );
	} );

	describe( 'setupQuoteSelection()', () => {
		it( 'should fire a new event after native event', done => {
			const pageManager = new PageManager();
			pageManager.setupQuoteSelection();

			const container = GitHubPage.appendElementHtml( '<div></div>' );

			GitHubPage.domManipulator.addEventListener( window, 'message', event => {
				expect( event.data.type ).to.equals( 'GitHub-RTE-Quote-Selection' );
				expect( event.data.text ).to.equals( 'test' );
				expect( event.data.timestamp ).to.be.a( 'number' ).greaterThan( 0 );
				expect( container.getAttribute( 'data-github-rte-quote-selection-timestamp' ) )
					.to.equals( event.data.timestamp.toString() );
				done();
			} );

			container.dispatchEvent( new CustomEvent( 'quote-selection', {
				bubbles: true,
				detail: {
					selectionText: 'test'
				}
			} ) );
		} );

		it( 'should send the event data to the editor', done => {
			const pageManager = new PageManager();
			pageManager.setupQuoteSelection();

			const container = GitHubPage.appendElementHtml( '<div></div>' );
			GitHubPage.appendRoot( { type: 'comment', target: container } );

			pageManager.scan()
				.then( editors => {
					const stub = sinon.stub( editors[ 0 ], 'quoteSelection' );

					stub.callsFake( text => {
						setTimeout( () => {
							expect( text ).to.equals( 'test' );
							done();
						}, 0 );
					} );

					container.dispatchEvent( new CustomEvent( 'quote-selection', {
						bubbles: true,
						detail: {
							selectionText: 'test'
						}
					} ) );
				} );
		} );

		it( 'should do nothing on empty text', done => {
			const pageManager = new PageManager();
			pageManager.setupQuoteSelection();

			const container = GitHubPage.appendElementHtml( '<div></div>' );
			GitHubPage.appendRoot( { type: 'comment', target: container } );

			pageManager.scan()
				.then( () => {
					const spy = sinon.spy( pageManager, 'setupEditor' );

					container.dispatchEvent( new CustomEvent( 'quote-selection', {
						bubbles: true,
						detail: {
							selectionText: ''
						}
					} ) );

					setTimeout( () => {
						expect( spy.notCalled ).to.be.true;
						done();
					}, 0 );
				} );
		} );

		it( 'should not setup twice', done => {
			const pageManager = new PageManager();
			pageManager.setupQuoteSelection();
			pageManager.setupQuoteSelection();

			const container = GitHubPage.appendElementHtml( '<div></div>' );
			GitHubPage.appendRoot( { type: 'comment', target: container } );

			pageManager.scan()
				.then( () => {
					const spy = sinon.spy( PageManager.prototype, 'setupEditor' );

					container.dispatchEvent( new CustomEvent( 'quote-selection', {
						bubbles: true,
						detail: {
							selectionText: 'test'
						}
					} ) );

					setTimeout( () => {
						expect( spy.callCount ).to.equals( 1 );

						PageManager.prototype.setupEditor.restore();

						done();
					}, 0 );
				} );
		} );

		it( 'should do nothing with wrong root match', done => {
			const pageManager = new PageManager();
			pageManager.setupQuoteSelection();

			const container = GitHubPage.appendElementHtml( '<div></div>' );

			pageManager.scan()
				.then( () => {
					// Dirty it up with a editor like form which hasn't been scanned.
					container.innerHTML = '<form class="js-inline-comment-form"></form>';

					const spy = sinon.spy( PageManager.prototype, 'setupEditor' );

					container.dispatchEvent( new CustomEvent( 'quote-selection', {
						bubbles: true,
						detail: {
							selectionText: 'test'
						}
					} ) );

					setTimeout( () => {
						expect( spy.callCount ).to.equals( 0 );

						PageManager.prototype.setupEditor.restore();

						done();
					}, 0 );
				} );
		} );
	} );
} );
