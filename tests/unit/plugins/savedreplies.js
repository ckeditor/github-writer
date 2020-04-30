/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import SavedReplies, { RepliesListView } from '../../../src/app/plugins/savedreplies';
import FilteredListView from '../../../src/app/modules/filteredlistview';

import { createTestEditor, fakeLocale as locale } from '../../_util/ckeditor';
import DropdownView from '@ckeditor/ckeditor5-ui/src/dropdown/dropdownview';

describe( 'Plugins', () => {
	describe( 'SavedReplies', () => {
		const url = 'https://test.com/sr';

		describe( 'Plugin', () => {
			let editor;

			beforeEach( () => {
				return createTestEditor( '', [ SavedReplies ], { githubWriter: { savedReplies: { url } } } )
					.then( editorObjects => ( { editor } = editorObjects ) );
			} );

			afterEach( () => {
				editor.destroy();
			} );

			it( 'should register the "savedReplies" component', () => {
				expect( editor.ui.componentFactory.has( 'savedReplies' ) ).to.be.true;
			} );

			describe( '"savedReplies" component', () => {
				let component;

				beforeEach( () => {
					component = editor.ui.componentFactory.create( 'savedReplies' );
				} );

				afterEach( () => {
					component.destroy();
				} );

				it( 'should be a dropdown', () => {
					expect( component ).to.be.an.instanceOf( DropdownView );
				} );

				it( 'should have a class', () => {
					expect( component.class ).to.equals( 'github-writer-saved-replies-button' );
				} );

				it( 'should open to sw', () => {
					expect( component.panelPosition ).to.equals( 'sw' );
				} );

				it( 'should set its button label', () => {
					expect( component.buttonView.label ).to.equals( 'Insert a reply' );
				} );

				it( 'should be ready for GH tooltips', () => {
					component.render();
					const button = component.buttonView.element;

					expect( button.classList.contains( 'tooltipped' ) ).to.be.true;
					expect( button.classList.contains( 'tooltipped-n' ) ).to.be.true;
					expect( button.getAttribute( 'aria-label' ) ).to.equals( 'Insert a reply' );
				} );

				it( 'should register a keyboard shortcut', () => {
					const evt = new KeyboardEvent( 'keydown', { ctrlKey: true, keyCode: 190 /* . */ } );
					editor.ui.view.editable.element.dispatchEvent( evt );

					expect( component.isOpen ).to.be.true;
				} );

				describe( 'replies list', () => {
					let list;

					beforeEach( () => {
						list = component.panelView.children.first;
					} );

					it( 'should be a child of the component', () => {
						expect( list ).to.exist;
					} );

					it( 'should be a "RepliesListView"', () => {
						expect( list ).be.an.instanceOf( RepliesListView );
					} );

					it( 'should have the url taken from the editor configuration', () => {
						expect( list.url ).to.equals( url );
					} );

					it( 'should insert the reply on user selection', () => {
						editor.focus = sinon.stub();
						component.isOpen = true;

						list.fire( 'reply', 'Test **reply**.' );

						expect( editor.getData() ).to.equals( 'Test **reply**.' );
						expect( component.isOpen ).to.be.false;
						expect( editor.focus.callCount ).to.equals( 1 );
					} );

					it( 'should focus the view on open', () => {
						sinon.stub( list, 'focus' );

						component.render();
						component.isOpen = true;

						expect( list.focus.callCount ).to.equals( 1 );
					} );
				} );
			} );
		} );

		describe( 'RepliesListView', () => {
			let xhr;
			let view, elements;

			beforeEach( () => {
				xhr = null;
				const sinonXhr = sinon.useFakeXMLHttpRequest();
				sinonXhr.onCreate = createdXhr => {
					xhr = createdXhr;

					xhr.respondWithReplies = () => {
						xhr.respond( 200, { 'Content-Type': 'text/html' }, `
							<details-menu>
								<button class="select-menu-item">
									<span class="select-menu-item-heading">
										Reply 1
									</span>
									<span class="js-saved-reply-body">
										Test **reply 1**.
									</span>
								</button>
								<button class="select-menu-item">
									<span class="select-menu-item-heading">
										Reply 2
									</span>
									<span class="js-saved-reply-body">
										Test **reply 2**.
									</span>
								</button>
							</details-menu>
						` );
					};
				};
			} );

			beforeEach( () => {
				view = new RepliesListView( locale, url );
				view.render();

				elements = {
					root: view.element.querySelector( ':scope.ck-filteredlist' ),
					header: view.element.querySelector( ':scope.ck-filteredlist > div.select-menu-header' ),
					filter: view.element.querySelector( ':scope.ck-filteredlist > div.select-menu-filters' ),
					list: view.element.querySelector( ':scope.ck-filteredlist > div.select-menu-list' ),
					footer: view.element.querySelector( ':scope.ck-filteredlist > div.select-menu-footer' )
				};
			} );

			afterEach( () => {
				view.destroy();
			} );

			it( 'should extend FilteredListView', () => {
				expect( view ).to.be.an.instanceOf( FilteredListView );
			} );

			it( 'should set the title', () => {
				expect( elements.header.querySelector( ':scope > span.select-menu-title' ).textContent )
					.to.equals( 'Select a reply' );
			} );

			it( 'should set the keystroke', () => {
				expect( elements.header.querySelector( ':scope > code' ).textContent ).to.equals( 'ctrl .' );
			} );

			it( 'should set the filter placeholder', () => {
				expect( elements.filter.querySelector( ':scope > input' ).placeholder ).to.equals( 'Filter replies...' );
			} );

			it( 'should fire "reply" on item selection', done => {
				view.once( 'reply', ( evt, replyBody ) => {
					expect( replyBody ).to.equals( 'Test **reply 1**.' );
					done();
				} );

				xhr.respondWithReplies();

				setTimeout( () => {
					const list = view.element.querySelector( ':scope.ck-filteredlist > div.select-menu-list' );
					const item = list.querySelector( ':scope > ul > li > button' );
					item.click();
				} );
			} );

			it( 'should go to settings when clicking "Create new..."', done => {
				xhr.respondWithReplies();

				setTimeout( () => {
					const stub = sinon.stub( window, '__setLocation' );

					const list = view.element.querySelector( ':scope.ck-filteredlist > div.select-menu-list' );
					const item = list.querySelector( ':scope > ul > li > button.github-writer-create-reply' );
					item.click();

					expect( stub.callCount ).to.equals( 1 );
					expect( stub.alwaysCalledWith( '/settings/replies?return_to=1' ) );

					done();
				} );
			} );

			describe( 'query()', () => {
				it( 'should return all items if empty', () => {
					const promise = view.query( '' )
						.then( items => {
							expect( items ).to.be.an( 'array' ).with.lengthOf( 3 );
							expect( items[ 0 ] ).to.include( { label: 'Reply 1', description: 'Test **reply 1**.' } );
							expect( items[ 1 ] ).to.include( { label: 'Reply 2', description: 'Test **reply 2**.' } );
							expect( items[ 2 ].createView ).to.be.a( 'function' );
						} );

					xhr.respondWithReplies();

					return promise;
				} );
			} );

			describe( 'getReplies()', () => {
				it( 'should return the same promise on second call', () => {
					const firstPromise = view.getReplies();
					expect( firstPromise ).to.be.an.instanceOf( Promise );

					xhr.respondWithReplies();

					return firstPromise.then( firstResolution => {
						const secondPromise = view.getReplies();
						expect( secondPromise ).to.equals( firstPromise );

						return secondPromise.then( secondResolution => {
							expect( secondResolution ).to.equals( firstResolution );
						} );
					} );
				} );

				it( 'should reject on xhr error', done => {
					const promise = view.getReplies();

					xhr.error();

					promise.catch( err => {
						expect( err ).to.be.an.instanceOf( Error );
						done();
					} );
				} );

				it( 'should reject on xhr abort', done => {
					const promise = view.getReplies();

					xhr.abort();

					promise.catch( err => {
						expect( err ).to.be.undefined;
						done();
					} );
				} );
			} );
		} );
	} );
} );
