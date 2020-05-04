/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import InputTextView from '@ckeditor/ckeditor5-ui/src/inputtext/inputtextview';
import FilteredListView from '../../../src/app/modules/filteredlistview';

import { fakeLocale as locale } from '../../_util/ckeditor';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

describe( 'Modules', () => {
	describe( 'FilteredListView', () => {
		let view;

		beforeEach( () => {
			view = new FilteredListView( locale );
		} );

		afterEach( () => {
			view.destroy();
		} );

		function query( results ) {
			if ( !view.isRendered ) {
				view.render();
			}

			view.filterInputView.element.value = 'Test';

			if ( !view.query.restore ) {
				sinon.stub( view, 'query' );
			}
			view.query.returns( results );

			view.filterInputView.fire( 'input' );

			return new Promise( resolve => {
				setTimeout( () => {
					const list = view.element.querySelector( ':scope.ck-filteredlist > div.select-menu-list' );
					const items = Array.from( list.querySelectorAll( ':scope > ul > li > button' ) );
					expect( items.length ).to.equals( results.length );

					resolve( items );
				} );
			} );
		}

		describe( 'constructor()', () => {
			it( 'creates #filterInputView', () => {
				expect( view.filterInputView ).to.be.instanceOf( InputTextView );
			} );
		} );

		describe( 'Template bindings', () => {
			let elements;

			beforeEach( () => {
				view.render();

				elements = {
					root: view.element.querySelector( ':scope.ck-filteredlist' ),
					header: view.element.querySelector( ':scope.ck-filteredlist > div.select-menu-header' ),
					filter: view.element.querySelector( ':scope.ck-filteredlist > div.select-menu-filters' ),
					list: view.element.querySelector( ':scope.ck-filteredlist > div.select-menu-list' ),
					footer: view.element.querySelector( ':scope.ck-filteredlist > div.select-menu-footer' )
				};
			} );

			it( 'title', () => {
				view.title = 'Test';

				expect( elements.header.querySelector( ':scope > span.select-menu-title' ).textContent )
					.to.equals( 'Test' );
			} );

			it( 'keystroke', () => {
				view.keystroke = 'Ctrl+Alt+T';

				expect( elements.header.querySelector( ':scope > code' ).style.display ).to.equals( '' );

				expect( elements.header.querySelector( ':scope > code' ).textContent ).to.equals( 'ctrl+alt t' );
			} );

			it( 'keystroke empty', () => {
				view.keystroke = '';

				expect( elements.header.querySelector( ':scope > code' ).style.display ).to.equals( 'none' );

				expect( elements.header.querySelector( ':scope > code' ).textContent ).to.equals( '' );
			} );

			it( 'footer', () => {
				view.footer = 'Test';

				expect( elements.footer.style.display ).to.equals( '' );

				expect( elements.footer.textContent ).to.equals( 'Test' );
			} );

			it( 'footer empty', () => {
				view.footer = '';

				expect( elements.footer.style.display ).to.equals( 'none' );

				expect( elements.footer.textContent ).to.equals( '' );
			} );
		} );

		describe( 'filterInputView', () => {
			beforeEach( () => {
				view.render();
			} );

			it( 'should trigger query', () => {
				view.filterInputView.element.value = 'Test';

				const spy = sinon.spy( view, 'query' );

				view.filterInputView.fire( 'input' );

				expect( spy.callCount ).to.equals( 1 );
				expect( spy.alwaysCalledWithExactly( 'Test' ) ).to.be.true;
			} );

			it( 'should focus the first list item on arrow down', () => {
				document.body.appendChild( view.element );

				return query( [ { label: 'Item 1' }, { label: 'Item 2' } ] ).then( items => {
					const filter = view.filterInputView.element;
					filter.focus();
					filter.dispatchEvent( new KeyboardEvent( 'keydown', { keyCode: 40 } ) );

					expect( items[ 0 ] ).to.equals( document.activeElement );
					view.element.remove();
				} );
			} );
		} );

		describe( 'list / query', () => {
			it( 'should list results', () => {
				return query( [ { label: 'Item 1' }, { label: 'Item 2' } ] ).then( items => {
					items.forEach( ( item, index ) => {
						expect( item.querySelector( ':scope > span.select-menu-item-heading' ).firstChild.wholeText )
							.to.equals( 'Item ' + ( index + 1 ) );
						expect( item.querySelector( ':scope > span.select-menu-item-heading > span.description' ) )
							.to.be.null;
						expect( item.querySelector( ':scope > code > span' ).textContent )
							.to.equals( 'ctrl ' + ( index + 1 ) );
					} );
				} );
			} );

			it( 'should add description', () => {
				return query( [ { label: 'Item 1', description: 'Descr 1' } ] ).then( items => {
					const item = items[ 0 ];

					expect( item.querySelector( ':scope > span.select-menu-item-heading' )
						.firstChild.wholeText ).to.equals( 'Item 1 ' );
					expect( item.querySelector( ':scope > span.select-menu-item-heading > span.description' )
						.firstChild.wholeText ).to.equals( 'Descr 1' );
					expect( item.querySelector( ':scope > code > span' ).textContent )
						.to.equals( 'ctrl 1' );
				} );
			} );

			it( 'should add custom view', () => {
				const custom = new ButtonView( locale );
				custom.label = 'Test';
				custom.class = 'custom-test';

				return query( [ { createView: () => custom } ] ).then( items => {
					const item = items[ 0 ];

					expect( item.querySelector( ':scope > span.select-menu-item-heading' ) ).to.be.null;
					expect( item.querySelector( ':scope > code' ) ).to.be.null;

					expect( item.querySelector( ':scope.custom-test > span.ck-button__label' )
						.firstChild.wholeText ).to.equals( 'Test' );

					custom.destroy();
				} );
			} );

			it( 'should set max nine keys', () => {
				const results = [];
				for ( let i = 1; i <= 10; i++ ) {
					results.push( { label: 'Item ' + i } );
				}

				return query( results ).then( items => {
					items.forEach( ( item, index ) => {
						expect( item.querySelector( ':scope > span.select-menu-item-heading' ).firstChild.wholeText )
							.to.equals( 'Item ' + ( index + 1 ) );
						expect( item.querySelector( ':scope > span.select-menu-item-heading > span.description' ) )
							.to.be.null;
						if ( index < 9 ) {
							expect( item.querySelector( ':scope > code > span' ).textContent )
								.to.equals( 'ctrl ' + ( index + 1 ) );
						} else {
							expect( item.querySelector( ':scope > code' ) ).to.be.null;
						}
					} );
				} );
			} );

			it( 'should remove previous items on second call', () => {
				return query( [ { label: 'Item 1' }, { label: 'Item 2' } ] ).then( () => {
					return query( [ { label: 'Item A' } ] ).then( items => {
						const item = items[ 0 ];

						expect( item.querySelector( ':scope > span.select-menu-item-heading' ).firstChild.wholeText )
							.to.equals( 'Item A' );
						expect( item.querySelector( ':scope > code > span' ).textContent )
							.to.equals( 'ctrl 1' );
					} );
				} );
			} );

			it( 'should execute on item click', done => {
				const data = [ { label: 'Item 1' }, { label: 'Item 2' } ];

				query( data ).then( items => {
					view.once( 'execute', ( evt, eventData ) => {
						expect( eventData ).to.equals( data[ 0 ] );
						view.once( 'execute', ( evt, eventData ) => {
							expect( eventData ).to.equals( data[ 1 ] );
							done();
						} );
						items[ 1 ].click();
					} );

					items[ 0 ].click();
				} );
			} );

			it( 'should execute on keystroke', done => {
				view.render();

				const keys = [
					new KeyboardEvent( 'keydown', { ctrlKey: true, keyCode: 49 } ), // Ctrl+1
					new KeyboardEvent( 'keydown', { ctrlKey: true, keyCode: 50 } ) // Ctrl+2
				];

				const data = [ { label: 'Item 1' }, { label: 'Item 2' } ];

				query( data ).then( () => {
					view.once( 'execute', ( evt, eventData ) => {
						expect( eventData ).to.equals( data[ 0 ] );
						view.once( 'execute', ( evt, eventData ) => {
							expect( eventData ).to.equals( data[ 1 ] );
							done();
						} );
						view.element.dispatchEvent( keys[ 1 ] );
					} );

					view.element.dispatchEvent( keys[ 0 ] );
				} );
			} );
		} );

		describe( 'focus()', () => {
			it( 'should focus the filter input', done => {
				view.render();
				document.body.appendChild( view.element );

				view.focus();

				setTimeout( () => {
					expect( view.filterInputView.element ).to.equals( document.activeElement );
					view.element.remove();
					done();
				} );
			} );
		} );
	} );
} );
