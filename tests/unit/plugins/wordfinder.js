/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import WordFinder from '../../../src/app/plugins/wordfinder';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import HeadingEditing from '@ckeditor/ckeditor5-heading/src/headingediting';
import CKEditorGitHubEditor from '../../../src/app/editor/ckeditorgithubeditor';

import priorities from '@ckeditor/ckeditor5-utils/src/priorities';
import { createTestEditor } from '../../_util/ckeditor';
import { getData as getViewData } from '@ckeditor/ckeditor5-engine/src/dev-utils/view';

describe( 'Plugins', () => {
	describe( 'WordFinder', () => {
		let editor, model, root, wordFinder;
		const attribute = 'word';

		{
			const defaultData =
				'Test data for the word match styler.' +
				'\n\n' +
				'The second paragraph of text for the styler.';

			beforeEach( 'create the test editor', () => {
				return createTestEditor( defaultData, [ WordFinder, HeadingEditing ] )
					.then( ret => ( { editor, model, root } = ret ) )
					.then( () => {
						wordFinder = editor.wordFinder;
						wordFinder.cleanCache();
					} );
			} );

			afterEach( 'destroy the test editor', () => {
				return editor.destroy();
			} );
		}

		describe( 'add()', () => {
			it( 'should save a basic finder definition', () => {
				wordFinder.add( { type: 'a', pattern: /pattern/ } );

				expect( wordFinder._finders ).to.have.lengthOf( 1 );

				const finder = wordFinder._finders[ 0 ];
				expect( finder ).to.have.property( 'regex' ).instanceOf( RegExp );
				expect( finder ).to.have.property( 'priority' ).equals( priorities.normal );
				expect( finder ).to.have.property( 'type' ).equals( 'a' );
				expect( finder ).to.have.property( 'callback' ).undefined;
			} );

			it( 'should save a complex finder definition', () => {
				const callback = () => {
				};
				wordFinder.add( { type: 'a', pattern: /pattern/, priority: 20, callback } );

				expect( wordFinder._finders ).to.have.lengthOf( 1 );

				const finder = wordFinder._finders[ 0 ];
				expect( finder ).to.have.property( 'regex' ).instanceOf( RegExp );
				expect( finder ).to.have.property( 'priority' ).equals( 20 );
				expect( finder ).to.have.property( 'type' ).equals( 'a' );
				expect( finder ).to.have.property( 'callback' ).equals( callback );
			} );

			it( 'should initialize the matcher regex and save it', () => {
				wordFinder.add( { type: 'a', pattern: /pattern/ } );

				expect( wordFinder._finders ).to.have.lengthOf( 1 );
				expect( wordFinder._finders[ 0 ].regex ).to.be.an.instanceOf( RegExp );
				expect( wordFinder._finders[ 0 ].regex.flags ).to.equal( 'g' );
			} );

			it( 'should accept a regex with the "g" flag', () => {
				wordFinder.add( { type: 'a', pattern: /pattern/g } );

				expect( wordFinder._finders ).to.have.lengthOf( 1 );
				expect( wordFinder._finders[ 0 ].regex ).to.be.an.instanceOf( RegExp );
				expect( wordFinder._finders[ 0 ].regex.flags ).to.equal( 'g' );
			} );

			it( 'should accept a regex with other flags', () => {
				wordFinder.add( { type: 'a', pattern: /pattern/i } );

				expect( wordFinder._finders ).to.have.lengthOf( 1 );
				expect( wordFinder._finders[ 0 ].regex ).to.be.an.instanceOf( RegExp );
				expect( wordFinder._finders[ 0 ].regex.flags ).to.equal( 'gi' );
			} );

			it( 'should respect priority order', () => {
				wordFinder.add( { type: 'a', pattern: /pattern/, priority: priorities.low } );
				wordFinder.add( { type: 'b', pattern: /pattern/ } );
				wordFinder.add( { type: 'c', pattern: /pattern/, priority: 'high' } );
				wordFinder.add( { type: 'd', pattern: /pattern/, priority: 'low' } );
				wordFinder.add( { type: 'e', pattern: /pattern/ } );
				wordFinder.add( { type: 'f', pattern: /pattern/, priority: priorities.high } );
				wordFinder.add( { type: 'g', pattern: /pattern/, priority: priorities.highest } );
				wordFinder.add( { type: 'h', pattern: /pattern/, priority: 3 } );
				wordFinder.add( { type: 'i', pattern: /pattern/, priority: 4 } );
				wordFinder.add( { type: 'j', pattern: /pattern/, priority: priorities.lowest } );
				wordFinder.add( { type: 'k', pattern: /pattern/, priority: 3 } );

				const list = wordFinder._finders.map( finder => finder.type );
				expect( list ).to.eql( [ 'g', 'c', 'f', 'i', 'h', 'k', 'b', 'e', 'a', 'd', 'j' ] );
			} );
		} );

		describe( 'conversion', () => {
			function getView() {
				return getViewData( editor.editing.view, { withoutSelection: true } );
			}

			it( 'should fire conversion just once for many converters', () => {
				const converterA = sinon.stub().returns( 'a' );
				const converterB = sinon.stub().returns( 'b' );

				editor.wordFinder.add( {
					type: 'a', pattern: /CD/, conversion: {
						'editingDowncast': converterA
					}
				} );

				editor.wordFinder.add( {
					type: 'b', pattern: /EF/, conversion: {
						'editingDowncast': converterB
					}
				} );

				editor.setData( 'AB CD EF GH' );

				expect( getView() ).to.equals( '<p>AB ' +
					'<a data-type="a" spellcheck="false">CD</a> ' +
					'<b data-type="b" spellcheck="false">EF</b> GH</p>' );

				expect( converterA.callCount ).to.equals( 1 );
				expect( converterB.callCount ).to.equals( 1 );
			} );

			it( 'should append the status attribute', done => {
				editor.wordFinder.add( {
					type: 'a', pattern: /CD/,
					callback: () => {
						return new Promise( resolve => {
							setTimeout( () => {
								resolve();
								setTimeout( () => {
									expect( getView() ).to.equals(
										'<p>AB <test data-type="a" spellcheck="false">CD</test> EF GH</p>' );
									done();
								} );
							} );
						} );
					},
					conversion: {
						'editingDowncast': () => 'test'
					}
				} );

				editor.setData( 'AB CD EF GH' );

				expect( getView() ).to.equals(
					'<p>AB <test data-status-pending="true" data-type="a" spellcheck="false">CD</test> EF GH</p>' );
			} );

			it( 'converter should be able to define the element name', () => {
				editor.wordFinder.add( {
					type: 'a', pattern: /CD/, conversion: {
						'editingDowncast': () => 'test'
					}
				} );

				editor.setData( 'AB CD EF GH' );

				expect( getView() ).to.equals( '<p>AB <test data-type="a" spellcheck="false">CD</test> EF GH</p>' );
			} );

			it( 'converter should be able to change attributes', () => {
				editor.wordFinder.add( {
					type: 'a', pattern: /CD/, conversion: {
						'editingDowncast': attribs => {
							attribs.custom = 'true';
							delete attribs.spellcheck;
							delete attribs[ 'data-type' ];
							return 'test';
						}
					}
				} );

				editor.setData( 'AB CD EF GH' );

				expect( getView() ).to.equals( '<p>AB <test custom="true">CD</test> EF GH</p>' );
			} );

			it( 'converter should do nothing if no converter is set', () => {
				editor.wordFinder.add( { type: 'a', pattern: /CD/ } );

				editor.setData( 'AB CD EF GH' );

				expect( getView() ).to.equals( '<p>AB CD EF GH</p>' );
			} );

			it( 'converter should accept mixed finders', () => {
				editor.wordFinder.add( { type: 'a', pattern: /CD/ } );
				editor.wordFinder.add( {
					type: 'b', pattern: /EF/, conversion: {
						'editingDowncast': () => 'b'
					}
				} );

				editor.setData( 'AB CD EF GH' );

				expect( getView() ).to.equals( '<p>AB CD <b data-type="b" spellcheck="false">EF</b> GH</p>' );
			} );
		} );

		describe( 'watch()', () => {
			function checkTextNodes( firstTextNode, expectedTexts, expectedAttribEnabled ) {
				let node = firstTextNode;
				let index = -1;

				while ( node && expectedTexts[ index + 1 ] ) {
					index++;

					expect( node.data ).to.equal( expectedTexts[ index ] );
					expect( node.hasAttribute( attribute ), `attribute on "${ expectedTexts[ index ] }"` )
						.to.be[ expectedAttribEnabled[ index ] ? 'true' : 'false' ];

					node = node.nextSibling;
				}

				// Should have checked all expected texts.
				expect( index + 1, 'available text nodes to check' ).to.equals( expectedTexts.length );
			}

			describe( 'should watch writer methods', () => {
				it( 'writer.insertText', () => {
					editor.wordFinder.add( { type: 'a', pattern: /magic/ } );

					model.change( writer => {
						writer.insertText( 'The magic test. ', writer.createPositionFromPath( root, [ 0, 0 ] ) );
					} );

					checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
						[ 'The ', 'magic', ' test. Test data for the word match styler.' ],
						[ false, true, false ] );
				} );

				it( 'writer.insertElement', () => {
					editor.wordFinder.add( { type: 'a', pattern: /magic/ } );

					model.change( writer => {
						const element = writer.createElement( 'paragraph' );
						writer.insertText( 'The magic test.', element );
						writer.insert( element, root, 0 );
					} );

					checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
						[ 'The ', 'magic', ' test.' ],
						[ false, true, false ] );
				} );

				it( 'writer.merge', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CDEF/ } );

					editor.setData( 'AB CD\n\nEF GH' );

					model.change( writer => {
						writer.merge( writer.createPositionAt( root, 1 ) );
					} );

					checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
						[ 'AB ', 'CDEF', ' GH' ],
						[ false, true, false ] );
				} );

				it( 'writer.move', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CD/ } );
					editor.wordFinder.add( { type: 'b', pattern: /EFGH/ } );

					editor.setData( 'AB CD EF\n\nGH IJ' );

					model.change( writer => {
						writer.move(
							writer.createRangeIn( root.getChild( 0 ) ),
							root.getChild( 1 ), 0 );
					} );

					checkTextNodes( root.getNodeByPath( [ 1, 0 ] ),
						[ 'AB ', 'CD', ' ', 'EFGH', ' IJ' ],
						[ false, true, false, true, false ] );
				} );

				it( 'writer.remove text', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CDGH/ } );

					editor.setData( 'AB CD EF GH IJ' );

					model.change( writer => {
						writer.remove(
							writer.createRange(
								writer.createPositionFromPath( root, [ 0, 5 ] ),
								writer.createPositionFromPath( root, [ 0, 9 ] ) ) );
					} );

					checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
						[ 'AB ', 'CDGH', ' IJ' ],
						[ false, true, false ] );
				} );

				it( 'writer.remove inline element', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CDEF/ } );

					editor.setData( 'AB CD\nEF GH' );

					model.change( writer => {
						writer.remove( root.getChild( 0 ).getChild( 1 ) );
					} );

					checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
						[ 'AB ', 'CDEF', ' GH' ],
						[ false, true, false ] );

					let node = root.getNodeByPath( [ 0, 0 ] );
					expect( node.data ).to.equal( 'AB ' );
					expect( node.hasAttribute( attribute ) ).to.be.false;

					node = node.nextSibling;
					expect( node.data ).to.equal( 'CDEF' );
					expect( node.hasAttribute( attribute ) ).to.be.true;

					node = node.nextSibling;
					expect( node.data ).to.equal( ' GH' );
					expect( node.hasAttribute( attribute ) ).to.be.false;
				} );

				it( 'writer.rename', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CD/ } );

					editor.setData( 'AB CD EF' );

					model.change( writer => {
						writer.rename( root.getChild( 0 ), 'heading1' );
					} );

					checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
						[ 'AB ', 'CD', ' EF' ],
						[ false, true, false ] );
				} );

				it( 'writer.split', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CD/ } );
					editor.wordFinder.add( { type: 'b', pattern: /GH/ } );
					editor.wordFinder.add( { type: 'c', pattern: /KL/ } );

					editor.setData( 'AB CD EF GH IJ KL MN' );

					model.change( writer => {
						writer.split(
							writer.createPositionFromPath( root, [ 0, 10 ] ) ); // G^H
					} );

					checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
						[ 'AB ', 'CD', ' EF G' ],
						[ false, true, false ] );

					checkTextNodes( root.getNodeByPath( [ 1, 0 ] ),
						[ 'H IJ ', 'KL', ' MN' ],
						[ false, true, false ] );
				} );
			} );

			describe( 'with formatting changes', () => {
				it( 'should keep the attribute if fully included', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CD/ } );

					editor.setData( 'AB CD EF' );

					model.change( writer => {
						writer.setAttribute( 'bold', true, writer.createRangeIn( root.getChild( 0 ) ) );
					} );

					expect( root.getChild( 0 ).getChild( 1 ).data ).to.equals( 'CD' );
					expect( root.getChild( 0 ).getChild( 1 ).hasAttribute( attribute ), attribute ).to.be.true;
					expect( root.getChild( 0 ).getChild( 1 ).hasAttribute( 'bold' ), 'bold' ).to.be.true;
				} );

				it( 'should remove the attribute if partially included', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CD/ } );

					editor.setData( 'AB CD EF' );

					model.change( writer => {
						writer.setAttribute( 'bold', true,
							writer.createRange(
								writer.createPositionFromPath( root, [ 0, 0 ] ),
								writer.createPositionFromPath( root, [ 0, 4 ] ) ) );
					} );

					checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
						[ 'AB C', 'D EF' ],
						[ false, false ] );
				} );

				it( 'should add the attribute on partial formatting removed', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CD/ } );

					editor.setData( '**AB C**D EF' );

					model.change( writer => {
						writer.removeAttribute( 'bold',
							writer.createRange(
								writer.createPositionFromPath( root, [ 0, 0 ] ),
								writer.createPositionFromPath( root, [ 0, 4 ] ) ) );
					} );

					checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
						[ 'AB ', 'CD', ' EF' ],
						[ false, true, false ] );
				} );

				it( 'should not have the attribute if partially included at the right side', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CD/ } );

					editor.setData( 'AB C**D EF**' );

					checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
						[ 'AB C', 'D EF' ],
						[ false, false ] );
				} );

				it( 'should not have the attribute if covered by different formatting', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CD/ } );

					editor.setData( '_AB C_**D EF**' );

					checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
						[ 'AB C', 'D EF' ],
						[ false, false ] );
				} );

				it( 'should not have the attribute if fully covered by only one of two formatting', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CD/ } );

					editor.setData( '_AB C**D EF**_' );

					checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
						[ 'AB C', 'D EF' ],
						[ false, false ] );
				} );
			} );

			describe( 'callback', () => {
				it( 'should be able to pass the attribute by returning false', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CD/ } );
					editor.wordFinder.add( { type: 'b', pattern: /EF/, callback: () => false } );

					editor.setData( 'AB CD EF GH' );

					let node = root.getChild( 0 ).getChild( 1 );
					expect( node.getAttribute( attribute ) ).to.equals( 'a:CD' );

					node = root.getChild( 0 ).getChild( 2 );
					expect( node.data ).to.equals( ' EF GH' );
				} );

				it( 'should be able to change the matched text', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CD/ } );
					editor.wordFinder.add( { type: 'b', pattern: /EF/i, callback: match => ( match.text = 'ef' ) } );

					editor.setData( 'AB CD EF GH' );

					let node = root.getChild( 0 ).getChild( 1 );
					expect( node.data ).to.equals( 'CD' );
					expect( node.getAttribute( attribute ) ).to.equals( 'a:CD' );

					node = root.getChild( 0 ).getChild( 3 );
					expect( node.data ).to.equals( 'ef' );
					expect( node.getAttribute( attribute ) ).to.equals( 'b:ef' );
				} );

				it( 'should be able to change the matched text followed by punctuation', () => {
					editor.wordFinder.add( { type: 'b', pattern: /EF/i, callback: match => ( match.text = 'ef' ) } );

					editor.setData( 'AB CD EF, GH' );

					let node = root.getChild( 0 ).getChild( 0 );
					expect( node.data ).to.equals( 'AB CD ' );

					node = root.getChild( 0 ).getChild( 1 );
					expect( node.data ).to.equals( 'ef' );
					expect( node.getAttribute( attribute ) ).to.equals( 'b:ef' );

					node = root.getChild( 0 ).getChild( 2 );
					expect( node.data ).to.equals( ', GH' );
				} );

				it( 'should be able to change the matched text followed by punctuation (promise)', done => {
					editor.wordFinder.add( {
						type: 'b', pattern: /EF/i, callback: match => {
							return new Promise( resolve => {
								match.text = 'ef';
								setTimeout( check );
								resolve();
							} );
						}
					} );

					editor.setData( 'AB CD EF, GH' );

					const node = root.getChild( 0 ).getChild( 1 );
					expect( node.data ).to.equals( 'EF' );
					expect( node.getAttribute( attribute ) ).to.equals( 'b[pending]:EF' );

					function check() {
						let node = root.getChild( 0 ).getChild( 0 );
						expect( node.data ).to.equals( 'AB CD ' );

						node = root.getChild( 0 ).getChild( 1 );
						expect( node.data ).to.equals( 'ef' );
						expect( node.getAttribute( attribute ) ).to.equals( 'b:ef' );

						node = root.getChild( 0 ).getChild( 2 );
						expect( node.data ).to.equals( ', GH' );

						done();
					}
				} );

				it( 'should be able to return a promise', done => {
					editor.wordFinder.add( {
						type: 'a', pattern: /CD|XY/, callback: match => {
							return new Promise( resolve => {
								match.text = 'XY';
								setTimeout( check );
								resolve();
							} );
						}
					} );

					editor.setData( 'AB CD EF' );

					const node = root.getChild( 0 ).getChild( 1 );
					expect( node.data ).to.equals( 'CD' );
					expect( node.getAttribute( attribute ) ).to.equals( 'a[pending]:CD' );

					function check() {
						const node = root.getChild( 0 ).getChild( 1 );
						expect( node.data ).to.equals( 'XY' );
						expect( node.getAttribute( attribute ) ).to.equals( 'a:XY' );

						done();
					}
				} );

				it( 'should handle changes while waiting for the promise', done => {
					let promiseCalled = false;

					editor.wordFinder.add( {
						type: 'a', pattern: /CD/i, callback: () => {
							if ( promiseCalled ) {
								expect.fail( 'should not reach this code' );
							} else {
								return new Promise( resolve => {
									promiseCalled = true;
									setTimeout( check, 0 );
									resolve();
								} );
							}
						}
					} );

					editor.setData( 'AB CD EF' );

					checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
						[ 'AB ', 'CD', ' EF' ],
						[ false, true, false ] );

					model.change( writer => {
						writer.insertText( '-', writer.createPositionFromPath( root, [ 0, 4 ] ) );
					} );

					function check() {
						checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
							[ 'AB C-D EF' ],
							[ false ] );

						done();
					}
				} );

				it( 'should handle range removal while waiting for the promise', done => {
					let promiseCalled = false;

					editor.wordFinder.add( {
						type: 'a', pattern: /CD/, callback: () => {
							if ( promiseCalled ) {
								expect.fail( 'should not reach this code' );
							} else {
								return new Promise( resolve => {
									promiseCalled = true;
									setTimeout( check, 0 );
									resolve();
								} );
							}
						}
					} );

					editor.setData( 'AB CD EF' );

					checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
						[ 'AB ', 'CD', ' EF' ],
						[ false, true, false ] );

					model.change( writer => {
						writer.remove( root.getChild( 0 ) );
						writer.insertElement( 'paragraph', root, 0 );
						writer.insertText( '12 34 56', root.getChild( 0 ), 0 );
					} );

					function check() {
						checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
							[ '12 34 56' ],
							[ false ] );

						done();
					}
				} );
			} );

			describe( 'selection', () => {
				it( 'should have attribute when inside the match', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CD/ } );

					editor.setData( 'AB CD EF' );

					model.change( writer => {
						writer.setSelection(
							writer.createPositionFromPath( root, [ 0, 4 ] ) );
					} );

					expect( model.document.selection.hasAttribute( attribute ) ).to.be.true;
				} );

				it( 'should not have attribute when after the match', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CD/ } );

					editor.setData( 'AB CD EF' );

					model.change( writer => {
						writer.setSelection(
							writer.createPositionFromPath( root, [ 0, 5 ] ) );
					} );

					expect( model.document.selection.hasAttribute( attribute ) ).to.be.false;
				} );

				it( 'should not have attribute when before the match', () => {
					editor.wordFinder.add( { type: 'a', pattern: /CD/ } );

					editor.setData( 'AB CD EF' );

					model.change( writer => {
						writer.setSelection(
							writer.createPositionFromPath( root, [ 0, 3 ] ) );
					} );

					expect( model.document.selection.hasAttribute( attribute ) ).to.be.false;
				} );
			} );

			it( 'should accept just one matcher for the same word', () => {
				editor.wordFinder.add( { type: 'a', pattern: /CD/ } );
				editor.wordFinder.add( { type: 'b', pattern: /\w+/ } );

				editor.setData( 'AB CD EF' );

				checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
					[ 'AB', ' ', 'CD', ' ', 'EF' ],
					[ true, false, true, false, true ] );

				let node = root.getNodeByPath( [ 0, 0 ] );
				expect( node.getAttribute( attribute ) ).to.equals( 'b:AB' );

				node = node.nextSibling.nextSibling;
				expect( node.getAttribute( attribute ) ).to.equals( 'a:CD' );

				node = node.nextSibling.nextSibling;
				expect( node.getAttribute( attribute ) ).to.equals( 'b:EF' );
			} );

			it( 'should watch for editor.setData', () => {
				editor.wordFinder.add( { type: 'a', pattern: /CD/ } );

				editor.setData( 'AB CD EF' );

				checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
					[ 'AB ', 'CD', ' EF' ],
					[ false, true, false ] );
			} );

			it( 'should watch initial editor data', () => {
				class StylerPlugin extends Plugin {
					static get requires() {
						return [ WordFinder ];
					}

					init() {
						this.editor.model.schema.extend( '$text', { allowAttributes: attribute } );

						this.editor.wordFinder.add( { type: 'a', pattern: /CD/ } );
					}
				}

				return CKEditorGitHubEditor.create( 'AB CD EF', { plugins: [ Paragraph, StylerPlugin ] } )
					.then( editor => {
						checkTextNodes( editor.model.document.getRoot().getNodeByPath( [ 0, 0 ] ),
							[ 'AB ', 'CD', ' EF' ],
							[ false, true, false ] );

						return editor.destroy(); // After test cleanup.
					} );
			} );
		} );
	} );
} );
