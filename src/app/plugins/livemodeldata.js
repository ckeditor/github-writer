/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global process */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

// A dictionary of words to help keeping the output size smaller.
const $element = 'e';
const $text = 't';
const $attribs = 'a';
const $children = '_';

/**
 * Enables `editor.model.data`, a "live" property that can be used to get and set simple native object representation
 * of the main root in the model document.
 *
 * The focus of this plugin is performance, providing a very fast way to dump the editor data
 * for every change made in the editor content. Using `editor.model.data` should be at least 100x faster
 * than `editor.getData()`.
 */
export default class LiveModelData extends Plugin {
	constructor( editor ) {
		super( editor );

		const liveDocumentData = new LiveDocumentData( editor.model.document );

		/**
		 * The model raw data as simple object.
		 *
		 * Attention: the object returned by this property must not be manipulated directly or it can
		 * immediately break the editor. If manipulation is necessary, be sure to do so in a deep clone of it.
		 *
		 * This property can be set to data in the same format as the one it outputs,
		 * having it the following structure:
		 *   {                -> document root, wrapping the whole data
		 *     _: [           -> root children
		 *       {            -> if element
		 *         e: "...",  -> element name
		 *         a: {},     -> element attributes (optional)
		 *         _: [ ... ] -> element children (optional)
		 *       },
		 *       {            -> if text
		 *         t: "...",  -> text data
		 *         a: {},     -> text attributes (optional)
		 *       },
		 *       ...
		 *     ]
		 *  }
		 *
		 * @memberOf Model
		 * @member {String} #data
		 */
		Object.defineProperty( editor.model, 'data', {
			get: () => {
				return liveDocumentData.get();
			},
			set: data => {
				return liveDocumentData.set( data );
			}
		} );
	}
}

/**
 * Maintains a "live" version of the main root element in a model document.
 *
 * By "live" we mean that changes to the model will just update the portions of the data that they touch.
 */
class LiveDocumentData {
	/**
	 * Creates an instance of the LiveDocumentData class.
	 *
	 * @param document {module:engine/model/document~Document} The document to be watching for changes.
	 */
	constructor( document ) {
		this.root = document.getRoot();

		// This is the "database" that holds the output text version for all nodes in the document model.
		const tree = this.tree = new Tree();

		document.on( 'change:data', () => {
			/* istanbul ignore next */
			if ( process.env.NODE_ENV !== 'production' ) {
				// Just set the following global (in the extension console) to see the performance log.
				if ( window.LOG_LIVE_MODEL_DATA ) {
					console.time( 'LiveModelData - process changes' );
				}
			}

			const changes = document.differ.getChanges();

			for ( const change of changes ) {
				const position = change.position;

				switch ( change.type ) {
					case 'insert' : {
						if ( change.name === '$text' ) {
							// It is hard to say precisely what a text insertion changed so we refresh
							// all texts (for simplicity).
							tree.refreshTexts( position.parent );
						} else {
							const element = position.nodeAfter;
							tree.insert( element );

							// If the element ended up between texts, there is a chance that it split them,
							// creating additional text nodes. As we don't have means to know that,
							// we refresh all texts (for simplicity).
							const isBetweenTexts = element.previousSibling && element.previousSibling.is( '$text' ) &&
								element.nextSibling && element.nextSibling.is( '$text' );
							if ( isBetweenTexts ) {
								tree.refreshTexts( position.parent );
							}
						}
						break;
					}
					case 'remove' : {
						if ( change.name === '$text' ) {
							// We have no information about which text nodes have been touched so
							// we refresh all of them (for simplicity).
							tree.refreshTexts( position.parent );
						} else {
							tree.remove( position );
						}
						break;
					}
					case 'attribute': {
						const walker = change.range.getWalker( { ignoreElementEnd: true } );
						let lastTextRefreshParent;

						for ( const { item } of walker ) {
							if ( item.is( 'element' ) ) {
								// If the walker is passing through an element, we just refresh it,
								// updating the attribute value in it (if it applies).
								tree.refreshNode( item );
							} else {
								// If instead we have a text node, we have no idea if it has been
								// merged with siblings, so we update it and all its sibling texts.
								if ( item.parent !== lastTextRefreshParent ) {
									tree.refreshTexts( item.parent );

									// Do it just once for this parent.
									lastTextRefreshParent = item.parent;
								}
							}
						}
					}
				}
			}

			/* istanbul ignore next */
			if ( process.env.NODE_ENV !== 'production' ) {
				if ( window.LOG_LIVE_MODEL_DATA ) {
					console.timeEnd( 'LiveModelData - process changes' );
				}
			}

			/**
			 * Fired when the `data` property value "potentially" changed.
			 *
			 * @memberOf {Model}
			 * @event #data
			 */
			document.model.fire( 'data' );
		} );
	}

	/**
	 * Gets the live object that holds the representation of the document main root data.
	 *
	 * This object must not be changed directly. It's main purpose is storage.
	 *
	 * return {Object} A live object.
	 */
	get() {
		return this.tree.root;
	}

	/**
	 * Sets the data of the main document root with data produced by get().
	 *
	 * @param data {Object} And object containing the model data representation.
	 */
	set( data ) {
		const root = this.root;
		const model = root.document.model;

		model.change( writer => {
			// Replace the document contents.
			writer.remove( writer.createRangeIn( root ) );
			writer.insert( createFragment( data, writer ), root );

			// Clean up previous document selection.
			writer.setSelection( null );
			writer.removeSelectionAttribute( model.document.selection.getAttributeKeys() );
		} );

		function createFragment( data, writer ) {
			const fragment = writer.createDocumentFragment();

			addChildren( data, fragment );

			return fragment;

			function addChildren( dataNode, modelTarget ) {
				const children = dataNode[ $children ];
				if ( children ) {
					let index = 0;
					let child;
					while ( ( child = children[ index ] ) ) {
						if ( $text in child ) {
							writer.appendText( child[ $text ], child[ $attribs ], modelTarget );
						} else {
							const element = writer.createElement( child[ $element ], child[ $attribs ] );

							// Go recursively.
							addChildren( child, element );

							writer.append( element, modelTarget );
						}

						index++;
					}
				}
			}
		}
	}
}

/**
 * Holds a deep object representation of model nodes.
 */
class Tree {
	/**
	 * Creates and instance of the Tree class with an empty root node.
	 */
	constructor() {
		/**
		 * The root node.
		 *
		 * @type {String[]}
		 */
		this.root = {};
	}

	/**
	 * Inserts a model node in the tree.
	 *
	 * The node position in the tree reflects its position in the model.
	 *
	 * @param modelNode {Element|Text} The model node to be inserted.
	 */
	insert( modelNode ) {
		const parent = this.getNode( modelNode.parent );
		const children = parent[ $children ] || ( parent[ $children ] = [] );
		children.splice( modelNode.index, 0, this.getDefinition( modelNode ) );
	}

	/**
	 * Remove a node from the tree based on its position.
	 *
	 * The position in the tree is calculated out of a model position.
	 *
	 * @param modelPosition {Position} The model position.
	 */
	remove( modelPosition ) {
		// By default we take the node which matches the position index.
		let index = modelPosition.index;

		// If we're inside a text node though, it means that the removed node was actually
		// after that text node, so we fix the index. To illustrate (e.g.):
		//
		// 	Index:  0          1         2
		//	Before: text-before|{removed}text-after -> | == position.index = 1
		//
		// 	Index:  0
		//	After: text-before|text-after -> | == position.index = 0
		//
		const inTextNode = modelPosition.textNode;
		if ( inTextNode ) {
			index = modelPosition.textNode.index + 1;
		}

		const parent = this.getNode( modelPosition.parent );
		parent[ $children ].splice( index, 1 );

		if ( !parent[ $children ].length ) {
			delete parent[ $children ];
		}

		// As demonstrated in the above comment, text need to be refreshed as they where merged.
		if ( inTextNode ) {
			this.refreshTexts( modelPosition.parent );
		}
	}

	/**
	 * Refreshes a node. This is useful when changes to attributes happen.
	 *
	 * @param modelNode {Element|Text} The node to be refreshed.
	 */
	refreshNode( modelNode ) {
		this.updateDefinition( this.getNode( modelNode ), modelNode );
	}

	/**
	 * Removes and re-inserts all text nodes that are direct children of an element.
	 *
	 * @param modelNode {Element} The parent element.
	 */
	refreshTexts( modelNode ) {
		const node = this.getNode( modelNode );
		const children = node[ $children ] || [];

		// Remove all text nodes.
		for ( let i = children.length - 1; i >= 0; i-- ) {
			if ( $text in children[ i ] ) {
				children.splice( i, 1 );
			}
		}

		// Insert all text nodes back again.
		Array.from( modelNode.getChildren() ).forEach( child => {
			if ( child.is( '$text' ) ) {
				children.splice( child.index, 0, this.getDefinition( child ) );
			}
		} );

		if ( children.length ) {
			node[ $children ] = children;
		} else {
			delete node[ $children ];
		}
	}

	/**
	 * Fills up a node definition, not including children nodes.
	 *
	 * @param definition {Object}
	 * @param modelNode {Element|Text} The node to be processed.
	 */
	updateDefinition( definition, modelNode ) {
		if ( modelNode.data ) {
			definition[ $text ] = modelNode.data;
		} else {
			definition[ $element ] = modelNode.name;
		}

		// Attributes.
		{
			const nodeAttribs = Array.from( modelNode.getAttributes() );

			if ( nodeAttribs.length ) {
				definition[ $attribs ] = nodeAttribs.reduce( ( obj, [ name, value ] ) => {
					obj[ name ] = value;
					return obj;
				}, {} );
			}
		}
	}

	/**
	 * Gets the complete node definition, including its children tree.
	 *
	 * @param modelNode {Element|Text} The node to be processed.
	 * @returns {Object} The node definition.
	 */
	getDefinition( modelNode ) {
		const definition = {};

		this.updateDefinition( definition, modelNode );

		if ( $element in definition ) {
			if ( modelNode.childCount ) {
				definition[ $children ] = Array.from( modelNode.getChildren() )
					.map( child => this.getDefinition( child ) );
			}
		}

		return definition;
	}

	/**
	 * Calculates the tree path for a given model node.
	 *
	 * The path reflects that node position in the model document.
	 *
	 * @param modelNode {Element|Text} The model node.
	 * @returns {Number[]} A sequence of indexes to reach this node in the tree.
	 */
	getPath( modelNode ) {
		const path = [];

		while ( modelNode.parent ) {
			path.unshift( modelNode.index );
			modelNode = modelNode.parent;
		}

		return path;
	}

	/**
	 * Gets the tree entry representing a model node.
	 *
	 * @param modelNode {Element|Text} The model node.
	 * @returns {String[]} The tree representation of the node.
	 */
	getNode( modelNode ) {
		const path = this.getPath( modelNode );

		let node = this.root;
		while ( path.length ) {
			node = node[ $children ][ path.shift() ];
		}

		return node;
	}
}
