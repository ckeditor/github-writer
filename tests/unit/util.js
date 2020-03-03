/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	checkDom,
	createElementFromHtml,
	DomManipulator,
	getInitials,
	getNewIssuePageDom,
	injectFunctionExecution,
	openXmlHttpRequest,
	PageIncompatibilityError
} from '../../src/app/util';

describe( 'Util', () => {
	describe( 'checkDom', () => {
		it( 'should pass if all properties are defined', () => {
			const obj = {
				a: 1,
				b: 'test',
				c: document.createElement( 'div' ),
				d: {
					f: 1,
					g: 'test'
				}
			};

			expect( () => checkDom( obj ) ).to.not.throw();
		} );

		it( 'should throw if a first level properties is false', () => {
			const obj = {
				a: 1,
				b: false,
			};

			expect( () => checkDom( obj ) ).to.throw( PageIncompatibilityError );
		} );

		it( 'should throw if a first level properties is null', () => {
			const obj = {
				a: 1,
				b: null,
			};

			expect( () => checkDom( obj ) ).to.throw( PageIncompatibilityError );
		} );

		it( 'should throw if a first level properties is undefined', () => {
			const obj = {
				a: 1,
				b: undefined,
			};

			expect( () => checkDom( obj ) ).to.throw( PageIncompatibilityError );
		} );

		it( 'should throw if a second level properties is undefined', () => {
			const obj = {
				a: 1,
				b: 'test',
				c: {
					d: 1,
					e: undefined
				}
			};

			expect( () => checkDom( obj ) ).to.throw( PageIncompatibilityError );
		} );
	} );

	describe( 'createElementFromHtml', () => {
		it( 'should create an element', () => {
			const element = createElementFromHtml( '<div>Test</div>' );

			expect( element ).to.be.an.instanceOf( HTMLElement );
			expect( element.nodeName ).to.equals( 'DIV' );
			expect( element.innerHTML ).to.equals( 'Test' );
		} );

		it( 'should create an deep element', () => {
			const element = createElementFromHtml(
				'<div>' +
				'	<p>Line 1</p>' +
				'	<p>Line 2</p>' +
				'</div>' );

			expect( element ).to.be.an.instanceOf( HTMLElement );
			expect( element.firstElementChild.nodeName ).to.equals( 'P' );
			expect( element.firstElementChild.innerHTML ).to.equals( 'Line 1' );
			expect( element.lastElementChild.nodeName ).to.equals( 'P' );
			expect( element.lastElementChild.innerHTML ).to.equals( 'Line 2' );
		} );
	} );

	describe( 'DomManipulator', () => {
		describe( 'should rollback', () => {
			it( 'addEventListener', () => {
				const domManipulator = new DomManipulator();

				const callback = sinon.spy();

				domManipulator.addEventListener( document.body, 'click', callback );

				document.body.click();
				expect( callback.calledOnce, 'first call' ).to.be.true;

				domManipulator.rollback();

				document.body.click();
				expect( callback.calledOnce, 'second call' ).to.be.true;
			} );

			it( 'addAttribute', () => {
				const domManipulator = new DomManipulator();

				domManipulator.addAttribute( document.body, 'data-test', 'test' );
				expect( document.body.getAttribute( 'data-test' ) ).to.equals( 'test' );

				domManipulator.rollback();
				expect( document.body.getAttribute( 'data-test' ) ).to.be.null;
			} );

			it( 'addClass', () => {
				const domManipulator = new DomManipulator();

				domManipulator.addClass( document.body, 'test-class' );
				expect( document.body.classList.contains( 'test-class' ) ).to.be.true;

				domManipulator.rollback();
				expect( document.body.classList.contains( 'data-test' ) ).to.be.false;
			} );

			it( 'toogleClass', () => {
				const domManipulator = new DomManipulator();

				domManipulator.toogleClass( document.body, 'test-class' );
				expect( document.body.classList.contains( 'test-class' ) ).to.be.true;

				domManipulator.toogleClass( document.body, 'test-class' );
				expect( document.body.classList.contains( 'test-class' ) ).to.be.false;

				domManipulator.toogleClass( document.body, 'test-class' );
				expect( document.body.classList.contains( 'test-class' ) ).to.be.true;

				domManipulator.rollback();
				expect( document.body.classList.contains( 'data-test' ) ).to.be.false;
			} );

			it( 'append', () => {
				const domManipulator = new DomManipulator();

				const element = document.createElement( 'div' );

				domManipulator.append( document.body, element );
				expect( element.parentNode ).to.equals( document.body );

				domManipulator.rollback();
				expect( element.parentNode ).to.be.null;
			} );

			it( 'appendAfter', () => {
				const domManipulator = new DomManipulator();

				const element = document.createElement( 'div' );
				document.body.append( element );

				const anotherElement = document.createElement( 'div' );
				domManipulator.appendAfter( element, anotherElement );

				expect( element.nextSibling ).to.equals( anotherElement );

				domManipulator.rollback();
				expect( element.nextSibling ).to.not.equals( anotherElement );
				expect( anotherElement.parentNode ).to.be.null;

				element.remove();
			} );

			it( 'addRollbackOperation', () => {
				const domManipulator = new DomManipulator();

				const op = sinon.stub();

				domManipulator.addRollbackOperation( op );
				domManipulator.rollback();

				expect( op.callCount ).to.equals( 1 );
			} );

			it( 'addRollbackOperation should be called once', () => {
				const domManipulator = new DomManipulator();

				const op = sinon.stub();

				domManipulator.addRollbackOperation( op );
				domManipulator.rollback();
				domManipulator.rollback();

				expect( op.callCount ).to.equals( 1 );
			} );
		} );
	} );

	describe( 'getInitials', () => {
		it( 'should return initials', () => {
			expect( getInitials( 'Run the Test' ) ).to.equals( 'RtT' );
			expect( getInitials( 'Run the Test 1 and 2' ) ).to.equals( 'RtT1a2' );
		} );

		it( 'should return empty for space', () => {
			expect( getInitials( ' ' ) ).to.equals( '' );
		} );

		it( 'should return empty for non text', () => {
			expect( getInitials( 1 ) ).to.equals( '' );
			expect( getInitials( null ) ).to.equals( '' );
		} );
	} );

	describe( 'injectFunctionExecution', () => {
		it( 'should inject a simple function', done => {
			window.__test = function() {
				done();
				delete window.__test;
			};

			injectFunctionExecution( function() {
				window.__test();
			} );
		} );

		it( 'should should accept comments', done => {
			window.__test = function() {
				done();
				delete window.__test;
			};

			injectFunctionExecution( function() {
				// Comment that could break things.
				window.__test();
			} );
		} );

		it( 'should remove the injected script element', done => {
			const elementCount = document.body.childElementCount;

			window.__test = function() {
				setTimeout( () => {
					expect( document.body.childElementCount ).to.equals( elementCount );
					done();
				}, 0 );
				delete window.__test;
			};

			injectFunctionExecution( function() {
				// Comment that could break things.
				window.__test();
			} );
		} );
	} );

	describe( 'openXmlHttpRequest', () => {
		let xhr;

		beforeEach( 'stub XMLHttpRequest', () => {
			const sinonXhr = sinon.useFakeXMLHttpRequest();
			sinonXhr.onCreate = createdXhr => ( xhr = createdXhr );
		} );

		it( 'should return an instance of XmlHttpRequest', () => {
			openXmlHttpRequest( 'test' );
			expect( xhr ).to.be.an.instanceOf( XMLHttpRequest );
		} );

		it( 'should be async', () => {
			openXmlHttpRequest( 'test' );
			expect( xhr.async ).to.be.true;
		} );

		it( 'should default to POST', () => {
			openXmlHttpRequest( 'test' );
			expect( xhr.method ).to.equals( 'POST' );
		} );

		it( 'should accept the desired method', () => {
			openXmlHttpRequest( 'test', 'GET' );
			expect( xhr.method ).to.equals( 'GET' );
		} );

		it( 'should set the X-Requested-With header', () => {
			openXmlHttpRequest( 'test' );
			expect( xhr.requestHeaders ).to.have.property( 'X-Requested-With', 'XMLHttpRequest' );
		} );

		it( 'should fix URLs starting with "/"', () => {
			sinon.stub( window, '__getLocation' ).returns( {
				protocol: 'https:',
				host: 'test.com'
			} );

			openXmlHttpRequest( '/test' );
			expect( xhr.url ).to.equals( 'https://test.com/test' );
		} );
	} );

	describe( 'getNewIssuePageDom', () => {
		let xhr;

		beforeEach( 'stub XMLHttpRequest', () => {
			const sinonXhr = sinon.useFakeXMLHttpRequest();
			sinonXhr.onCreate = createdXhr => ( xhr = createdXhr );
		} );

		beforeEach( 'stub location', () => {
			sinon.stub( window, '__getLocation' ).returns( {
				protocol: 'https:',
				host: 'test.com',
				pathname: '/org/repo/test'
			} );
		} );

		it( 'should retrieve the proper url', () => {
			getNewIssuePageDom();
			expect( xhr.url ).to.equals( 'https://test.com/org/repo/issues/new' );
			expect( xhr.method ).to.equals( 'GET' );
		} );

		it( 'should return a DOM', () => {
			const promise = getNewIssuePageDom().then( dom => {
				expect( dom ).to.be.an.instanceOf( DocumentFragment );
				expect( dom.querySelector( 'p' ) ).to.be.an.instanceOf( HTMLElement );
				expect( dom.querySelector( 'p' ).innerHTML ).to.equals( 'Test' );
			} );

			xhr.respond( 200, { 'Content-Type': 'text/html' },
				'<!DOCTYPE html>\n' +
				'<html lang="en">' +
				'<head>' +
				'<title></title>' +
				'<script>throw new Error( "This script should not execute (head)" )</script>' +
				'</head>' +
				'<body>' +
				'<p>Test</p>' +
				'<script>throw new Error( "This script should not execute (body)" )</script>' +
				'</body>' +
				'</html>' );

			return promise;
		} );

		it( 'should reject on abort', done => {
			getNewIssuePageDom()
				.catch( err => {
					expect( err ).to.be.undefined;
					done();
				} );

			xhr.abort();
		} );

		it( 'should reject on error', done => {
			getNewIssuePageDom()
				.catch( err => {
					expect( err ).to.be.an.instanceOf( Error );
					done();
				} );

			xhr.error();
		} );
	} );

	describe( 'PageIncompatibilityError', () => {
		it( 'should be an instance of Error', () => {
			const error = new PageIncompatibilityError( 'test' );
			expect( error ).to.be.an.instanceOf( Error );
		} );

		it( 'should have a message pointing to the faulty element key', () => {
			const error = new PageIncompatibilityError( 'xyz' );
			expect( error.message ).to.include( 'xyz' );
		} );
	} );
} );
