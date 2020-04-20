/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { WordMatchStyler } from '../../../../src/app/plugins/autolinking';

import { createTestEditor } from '../../../_util/ckeditor';

import CKEditorGitHubEditor from '../../../../src/app/editors/ckeditorgithubeditor';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import HeadingEditing from '@ckeditor/ckeditor5-heading/src/headingediting';

describe( 'Plugins', () => {
	describe( 'AutoLinking', () => {
		describe( 'WordMatchStyler', () => {
			const attribute = 'test-attribute';

			describe( 'attribute', () => {
				it( 'should be initialized on creation', () => {
					const styler = new WordMatchStyler( attribute );
					expect( styler.attribute ).to.equal( attribute );
				} );
			} );

			describe( 'addMatcher()', () => {
				it( 'should initialize the matcher regex and save it', () => {
					const styler = new WordMatchStyler( attribute );

					styler.addMatcher( /pattern/ );

					expect( styler._matchers ).to.have.lengthOf( 1 );
					expect( styler._matchers[ 0 ].regex ).to.be.an.instanceOf( RegExp );
					expect( styler._matchers[ 0 ].regex.flags ).to.equal( 'g' );
				} );

				it( 'should accept a regex with the "g" flag', () => {
					const styler = new WordMatchStyler( attribute );

					styler.addMatcher( /pattern/g );

					expect( styler._matchers ).to.have.lengthOf( 1 );
					expect( styler._matchers[ 0 ].regex ).to.be.an.instanceOf( RegExp );
					expect( styler._matchers[ 0 ].regex.flags ).to.equal( 'g' );
				} );

				it( 'should accept a regex with other flags', () => {
					const styler = new WordMatchStyler( attribute );

					styler.addMatcher( /pattern/i );

					expect( styler._matchers ).to.have.lengthOf( 1 );
					expect( styler._matchers[ 0 ].regex ).to.be.an.instanceOf( RegExp );
					expect( styler._matchers[ 0 ].regex.flags ).to.equal( 'gi' );
				} );
			} );

			describe( 'watch()', () => {
				let editor, model, root;

				{
					const defaultData =
						'Test data for the word match styler.' +
						'\n\n' +
						'The second paragraph of text for the styler.';

					beforeEach( 'create the test editor', () => {
						return createTestEditor( defaultData, [ HeadingEditing ] )
							.then( ret => ( { editor, model, root } = ret ) )
							.then( () => editor.model.schema.extend( '$text', { allowAttributes: attribute } ) );
					} );

					afterEach( 'destroy the test editor', () => {
						return editor.destroy();
					} );
				}

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
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /magic/ );

						styler.watch( editor );

						model.change( writer => {
							writer.insertText( 'The magic test. ', writer.createPositionFromPath( root, [ 0, 0 ] ) );
						} );

						checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
							[ 'The ', 'magic', ' test. Test data for the word match styler.' ],
							[ false, true, false ] );
					} );

					it( 'writer.insertElement', () => {
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /magic/ );

						styler.watch( editor );

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
						editor.setData( 'AB CD\n\nEF GH' );

						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CDEF/ );

						styler.watch( editor );

						model.change( writer => {
							writer.merge( writer.createPositionAt( root, 1 ) );
						} );

						checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
							[ 'AB ', 'CDEF', ' GH' ],
							[ false, true, false ] );
					} );

					it( 'writer.move', () => {
						editor.setData( 'AB CD EF\n\nGH IJ' );

						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CD/ );
						styler.addMatcher( /EFGH/ );

						styler.watch( editor );

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
						editor.setData( 'AB CD EF GH IJ' );

						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CDGH/ );

						styler.watch( editor );

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
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CDEF/ );

						styler.watch( editor );

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
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CD/ );

						styler.watch( editor );

						editor.setData( 'AB CD EF' );

						model.change( writer => {
							writer.rename( root.getChild( 0 ), 'heading1' );
						} );

						checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
							[ 'AB ', 'CD', ' EF' ],
							[ false, true, false ] );
					} );

					it( 'writer.split', () => {
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CD/ );
						styler.addMatcher( /GH/ );
						styler.addMatcher( /KL/ );

						styler.watch( editor );

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
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CD/ );

						styler.watch( editor );

						editor.setData( 'AB CD EF' );

						model.change( writer => {
							writer.setAttribute( 'bold', true, writer.createRangeIn( root.getChild( 0 ) ) );
						} );

						expect( root.getChild( 0 ).getChild( 1 ).data ).to.equals( 'CD' );
						expect( root.getChild( 0 ).getChild( 1 ).hasAttribute( attribute ), attribute ).to.be.true;
						expect( root.getChild( 0 ).getChild( 1 ).hasAttribute( 'bold' ), 'bold' ).to.be.true;
					} );

					it( 'should remove the attribute if partially included', () => {
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CD/ );

						styler.watch( editor );

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
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CD/ );

						styler.watch( editor );

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
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CD/ );

						styler.watch( editor );

						editor.setData( 'AB C**D EF**' );

						checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
							[ 'AB C', 'D EF' ],
							[ false, false ] );
					} );

					it( 'should not have the attribute if covered by different formatting', () => {
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CD/ );

						styler.watch( editor );

						editor.setData( '_AB C_**D EF**' );

						checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
							[ 'AB C', 'D EF' ],
							[ false, false ] );
					} );

					it( 'should not have the attribute if fully covered by only one of two formatting', () => {
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CD/ );

						styler.watch( editor );

						editor.setData( '_AB C**D EF**_' );

						checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
							[ 'AB C', 'D EF' ],
							[ false, false ] );
					} );
				} );

				describe( 'callback', () => {
					it( 'should be able to add attributes', () => {
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CD/, attribs => {
							attribs.test = true;
							attribs.custom = 'some value';
						} );

						styler.watch( editor );

						editor.setData( 'AB CD EF' );

						const node = root.getChild( 0 ).getChild( 1 );
						expect( node.getAttribute( attribute ) ).to.have.property( 'test', true );
						expect( node.getAttribute( attribute ) ).to.have.property( 'custom', 'some value' );
					} );

					it( 'should be able to disable the attribute by returning false', () => {
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CD/ );
						styler.addMatcher( /EF/, () => false );

						styler.watch( editor );

						editor.setData( 'AB CD EF GH' );

						let node = root.getChild( 0 ).getChild( 1 );
						expect( node.getAttribute( attribute ) ).to.have.property( 'enabled', true );

						node = root.getChild( 0 ).getChild( 3 );
						expect( node.getAttribute( attribute ) ).to.have.property( 'enabled', false );
					} );

					it( 'should be able to change the matched text', () => {
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CD/ );
						styler.addMatcher( /EF/i, attribs => ( attribs.text = 'ef' ) );

						styler.watch( editor );

						editor.setData( 'AB CD EF GH' );

						let node = root.getChild( 0 ).getChild( 1 );
						expect( node.data ).to.equals( 'CD' );
						expect( node.getAttribute( attribute ) ).to.have.property( 'text', 'CD' );

						node = root.getChild( 0 ).getChild( 3 );
						expect( node.data ).to.equals( 'ef' );
						expect( node.getAttribute( attribute ) ).to.have.property( 'text', 'ef' );
					} );

					it( 'should be able to change the matched text followed by punctuation', () => {
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /[EF]+/i, attribs => ( attribs.text = 'ef' ) );

						styler.watch( editor );

						editor.setData( 'AB CD EF, GH' );

						let node = root.getChild( 0 ).getChild( 0 );
						expect( node.data ).to.equals( 'AB CD ' );

						node = root.getChild( 0 ).getChild( 1 );
						expect( node.data ).to.equals( 'ef' );
						expect( node.getAttribute( attribute ) ).to.have.property( 'text', 'ef' );

						node = root.getChild( 0 ).getChild( 2 );
						expect( node.data ).to.equals( ', GH' );
					} );

					it( 'should be able to change the matched text followed by punctuation (promise)', done => {
						const styler = new WordMatchStyler( attribute );
						let promiseCalled = false;

						styler.addMatcher( /EF/i, attribs => {
							if ( promiseCalled ) {
								attribs.text = 'ef';
								setTimeout( check, 0 );
							} else {
								return new Promise( resolve => {
									promiseCalled = true;
									resolve();
								} );
							}
						} );

						styler.watch( editor );

						editor.setData( 'AB CD EF, GH' );

						const node = root.getChild( 0 ).getChild( 1 );
						expect( node.data ).to.equals( 'EF' );
						expect( node.getAttribute( attribute ) ).to.not.have.property( 'test' );

						function check() {
							let node = root.getChild( 0 ).getChild( 0 );
							expect( node.data ).to.equals( 'AB CD ' );

							node = root.getChild( 0 ).getChild( 1 );
							expect( node.data ).to.equals( 'ef' );
							expect( node.getAttribute( attribute ) ).to.have.property( 'text', 'ef' );

							node = root.getChild( 0 ).getChild( 2 );
							expect( node.data ).to.equals( ', GH' );

							done();
						}
					} );

					it( 'should be able to return a promise', done => {
						const styler = new WordMatchStyler( attribute );
						let promiseCalled = false;

						styler.addMatcher( /CD/i, attribs => {
							if ( promiseCalled ) {
								attribs.test = true;
								setTimeout( check, 0 );
							} else {
								return new Promise( resolve => {
									promiseCalled = true;
									resolve();
								} );
							}
						} );

						styler.watch( editor );

						editor.setData( 'AB CD EF' );

						const node = root.getChild( 0 ).getChild( 1 );
						expect( node.data ).to.equals( 'CD' );
						expect( node.getAttribute( attribute ) ).to.not.have.property( 'test' );

						function check() {
							const node = root.getChild( 0 ).getChild( 1 );
							expect( node.data ).to.equals( 'CD' );
							expect( node.getAttribute( attribute ) ).to.have.property( 'test', true );

							done();
						}
					} );

					it( 'should handle changes while waiting for the promise', done => {
						const styler = new WordMatchStyler( attribute );
						let promiseCalled = false;

						styler.addMatcher( /CD/i, () => {
							if ( promiseCalled ) {
								expect.fail( 'should not reach this code' );
							} else {
								return new Promise( resolve => {
									promiseCalled = true;
									setTimeout( check, 0 );
									resolve();
								} );
							}
						} );

						styler.watch( editor );

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
						const styler = new WordMatchStyler( attribute );
						let promiseCalled = false;

						styler.addMatcher( /CD/i, () => {
							if ( promiseCalled ) {
								expect.fail( 'should not reach this code' );
							} else {
								return new Promise( resolve => {
									promiseCalled = true;
									setTimeout( check, 0 );
									resolve();
								} );
							}
						} );

						styler.watch( editor );

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
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CD/ );

						styler.watch( editor );

						editor.setData( 'AB CD EF' );

						model.change( writer => {
							writer.setSelection(
								writer.createPositionFromPath( root, [ 0, 4 ] ) );
						} );

						expect( model.document.selection.hasAttribute( attribute ) ).to.be.true;
					} );

					it( 'should not have attribute when after the match', () => {
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CD/ );

						styler.watch( editor );

						editor.setData( 'AB CD EF' );

						model.change( writer => {
							writer.setSelection(
								writer.createPositionFromPath( root, [ 0, 5 ] ) );
						} );

						expect( model.document.selection.hasAttribute( attribute ) ).to.be.false;
					} );

					it( 'should not have attribute when before the match', () => {
						const styler = new WordMatchStyler( attribute );

						styler.addMatcher( /CD/ );

						styler.watch( editor );

						editor.setData( 'AB CD EF' );

						model.change( writer => {
							writer.setSelection(
								writer.createPositionFromPath( root, [ 0, 3 ] ) );
						} );

						expect( model.document.selection.hasAttribute( attribute ) ).to.be.false;
					} );
				} );

				it( 'should accept just one matcher for the same word', () => {
					const styler = new WordMatchStyler( attribute );

					styler.addMatcher( /CD/, attribs => ( attribs.test = true ) );
					styler.addMatcher( /\w+/ );

					styler.watch( editor );

					editor.setData( 'AB CD EF' );

					checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
						[ 'AB', ' ', 'CD', ' ', 'EF' ],
						[ true, false, true, false, true ] );

					let node = root.getNodeByPath( [ 0, 0 ] );
					expect( node.getAttribute( attribute ) ).to.not.have.property( 'test' );

					node = node.nextSibling.nextSibling;
					expect( node.getAttribute( attribute ) ).to.have.property( 'test' );

					node = node.nextSibling.nextSibling;
					expect( node.getAttribute( attribute ) ).to.not.have.property( 'test' );
				} );

				it( 'should watch for editor.setData', () => {
					const styler = new WordMatchStyler( attribute );

					styler.addMatcher( /CD/ );

					styler.watch( editor );

					editor.setData( 'AB CD EF' );

					checkTextNodes( root.getNodeByPath( [ 0, 0 ] ),
						[ 'AB ', 'CD', ' EF' ],
						[ false, true, false ] );
				} );

				it( 'should watch initial editor data', () => {
					class StylerPlugin extends Plugin {
						init() {
							this.editor.model.schema.extend( '$text', { allowAttributes: attribute } );

							const styler = new WordMatchStyler( attribute );
							styler.addMatcher( /CD/ );
							styler.watch( this.editor );
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
} );
