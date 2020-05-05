/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

/**
 * Enables `editor.model.data`, a "live" property that can be used to get and set a XML representation
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
		 * The model raw data as a XML string.
		 *
		 * It can be set to data in the same format as the one it outputs, having the following elements:
		 *  <root>            : document root, wrapping the whole data
		 *  <element          : element
		 *      name="..."    : element name
		 *      attribs="..." : element attributes stringified (optional)
		 *  ></element>
		 *  <text             : text node
		 *      attribs="..." : text node attributes stringified (optional)
		 *  >...</text>       : text node data
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

		// This is the "database" that holds the ouput text version for all nodes in the document model.
		const tree = this.tree = new Tree();

		document.on( 'change:data', () => {
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
							const isBetweenTexts = element.previousSibling && element.previousSibling.is( 'text' ) &&
								element.nextSibling && element.nextSibling.is( 'text' );
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

			// Reset the cache for the next get() call.
			this._cache = null;

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
	 * Gets the XML representation of the document main root data.
	 *
	 * The data is cached on first call until the next document change.
	 *
	 * return {String}
	 */
	get() {
		if ( typeof this._cache === 'string' ) {
			return this._cache;
		}
		return ( this._cache = this.tree.getData() );
	}

	/**
	 * Sets the data of the main document root.
	 *
	 * @param data {String} The XML representation of the data.
	 */
	set( data ) {
		const root = this.root;
		const model = root.document.model;

		model.change( writer => {
			// Replace the document contents.
			writer.remove( writer.createRangeIn( root ) );
			writer.insert( this.parse( data, writer ), root );

			// Clean up previous document selection.
			writer.setSelection( null );
			writer.removeSelectionAttribute( model.document.selection.getAttributeKeys() );
		} );
	}

	/**
	 * Parses a XML string representing document data into a DocumentFragment.
	 *
	 * @param data {String} The XML data to be parsed.
	 * @param writer {module:engine/model/writer~Writer} The model writer used to create the document fragment.
	 *
	 * @returns {module:engine/model/documentfragment~DocumentFragment} A document fragment filled with the data.
	 */
	parse( data, writer ) {
		const fragment = writer.createDocumentFragment();

		const parser = new DOMParser();
		const xmlDocument = parser.parseFromString( data, 'application/xml' );

		// firstElementChild == <root> : add all its children to the fragment.
		addChildren( xmlDocument.firstElementChild, fragment );

		return fragment;

		function addChildren( xmlNode, modelTarget ) {
			let child = xmlNode.firstElementChild;

			while ( child ) {
				// Take the attributes.
				let attribs = child.getAttribute( 'attribs' );
				attribs = attribs && JSON.parse( attribs );

				if ( child.nodeName === 'text' ) {
					writer.appendText( child.textContent, attribs, modelTarget );
				} else {
					const name = child.getAttribute( 'name' );
					const element = writer.createElement( name, attribs );

					// Go recursively.
					addChildren( child, element );

					writer.append( element, modelTarget );
				}

				child = child.nextElementSibling;
			}
		}
	}
}

/**
 * Holds a deep array representation of nodes and their XML text representation.
 *
 * Every node is represented by an array with at least two items in this format:
 * 	[
 * 		'<root|element|text [name="..."] [attribs="..."]>',
 * 		[...child nodes,]
 * 		'</root|element|text>
 * 	]
 *
 * The above allows for a super-fast generation of a single XML string representing a whole
 * document by executing `array.join( '' )`.
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
		this.root = [ '<root>', '</root>' ];
	}

	/**
	 * Retrieves the whole tree as a single concatenated string.
	 *
	 * @returns {String} The tree as a XML string.
	 */
	getData() {
		return this.root.flat( Infinity ).join( '' );
	}

	/**
	 * Inserts a model node in the tree.
	 *
	 * The node position in the tree reflects its position in the model.
	 *
	 * @param modelNode {Element|Text} The model node to be inserted.
	 */
	insert( modelNode ) {
		this.getNode( modelNode.parent ).splice( modelNode.index + 1, 0, this.getDefinition( modelNode ) );
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

		this.getNode( modelPosition.parent ).splice( index + 1, 1 );

		// As demonstrated in the above comment, text need to be refreshed as they where merged.
		if ( inTextNode ) {
			this.refreshTexts( modelPosition.parent );
		}
	}

	/**
	 * Refreshes the "opening tag" part of the node entry. This is useful when changes
	 * to attributes need to be retrieved.
	 *
	 * @param modelNode {Element|Text} The node to be refreshed.
	 */
	refreshNode( modelNode ) {
		this.getNode( modelNode )[ 0 ] = this.getDefinitionStart( modelNode );
	}

	/**
	 * Removes and re-inserts all text nodes that are direct children of an element.
	 *
	 * @param modelNode {Element} The parent element.
	 */
	refreshTexts( modelNode ) {
		const node = this.getNode( modelNode );

		// Remove all text nodes.
		for ( let i = node.length - 2; i > 0; i-- ) {
			if ( node[ i ].type === 'text' ) {
				node.splice( i, 1 );
			}
		}

		// Insert all text nodes back again.
		Array.from( modelNode.getChildren() ).forEach( child => {
			if ( child.is( 'text' ) ) {
				node.splice( child.index + 1, 0, this.getDefinition( child ) );
			}
		} );
	}

	/**
	 * Builds the "opening XML tag" for a given node.
	 *
	 * @param modelNode {Element|Text} The node to be processed.
	 * @returns {string} The opening tag.
	 */
	getDefinitionStart( modelNode ) {
		let type;
		const attribs = [];

		if ( modelNode.data ) {
			type = 'text';
		} else {
			type = `element`;
			attribs.push( ' name="', escapeAttrib( modelNode.name ), '"' );
		}

		// Node attributes.
		{
			const nodeAttribs = Array.from( modelNode.getAttributes() );

			if ( nodeAttribs.length ) {
				const attribsObj = nodeAttribs.reduce( ( obj, [ name, value ] ) => {
					obj[ name ] = value;
					return obj;
				}, {} );

				attribs.push( ' attribs="', escapeAttrib( JSON.stringify( attribsObj ) ), '"' );
			}
		}

		return `<${ type }${ attribs.join( '' ) }>`;
	}

	/**
	 * Gets the complete node definition, including its children tree.
	 *
	 * @param modelNode {Element|Text} The node to be processed.
	 * @returns {String[]} The array containing the node parts (opening tag, ...children, closing tag).
	 */
	getDefinition( modelNode ) {
		let type, children;

		if ( modelNode.data ) {
			type = 'text';
			children = [ escapeText( modelNode.data ) ];
		} else {
			type = `element`;
			children = modelNode.childCount ?
				Array.from( modelNode.getChildren() ).map( child => this.getDefinition( child ) ) :
				[];
		}

		const definition = [
			this.getDefinitionStart( modelNode ),
			...children,
			`</${ type }>`
		];

		definition.type = type;

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
			// The index is added by 1 to account for the "opening tag" of every node in the tree.
			path.unshift( modelNode.index + 1 );
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
			node = node[ path.shift() ];
		}

		return node;
	}
}

/**
 * Escapes XML text.
 *
 * @param value {String} Text to be escaped.
 * @returns {String} Escaped text.
 */
function escapeText( value ) {
	return value
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' );
}

/**
 * Escapes XML attribute values.
 *
 * @param value {String} Attribute value.
 * @returns {String} Escaped value.
 */
function escapeAttrib( value ) {
	return value
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( /"/g, '&quot;' );
}
