/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global process */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import LiveRange from '@ckeditor/ckeditor5-engine/src/model/liverange';

import { escapeRegex } from '../modules/util';

/**
 * Enables a set of predefined auto-formatting actions.
 *
 * For a detailed overview, check the {@glink features/autoformat Auto-formatting feature documentation}
 * and the {@glink api/autoformat package page}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class AutoFormat extends Plugin {
	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		/**
		 * Tells if the editor content is empty.
		 *
		 * @readonly
		 * @memberOf Editor
		 * @member {AutoFormatManager} #autoFormat
		 */
		editor.autoFormat = new AutoFormatManager( editor );
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'AutoFormat';
	}

	/**
	 * @inheritDoc
	 */
	afterInit() {
		const autoFormat = this.editor.autoFormat;

		// Inline
		autoFormat.add( 'bold', new InlineAutoFormatter( '**', 'bold' ) );
		autoFormat.add( 'bold __', new InlineAutoFormatter( '__', 'bold' ) );
		autoFormat.add( 'italic', new InlineAutoFormatter( '_', 'italic' ) );
		autoFormat.add( 'italic *', new InlineAutoFormatter( '*', 'italic' ) );
		autoFormat.add( 'code', new InlineAutoFormatter( '`', 'code' ) );
		autoFormat.add( 'strikethrough', new InlineAutoFormatter( '~', 'strikethrough' ) );
		autoFormat.add( 'kbd', new InlineAutoFormatter( '|', 'kbd' ) );

		// Block
		autoFormat.add( 'blockQuote', new BlockAutoFormatter( '> ', 'blockQuote' ) );
		autoFormat.add( 'codeBlock', new BlockAutoFormatter( '```', 'codeBlock' ) );
		autoFormat.add( 'horizontalLine', new BlockAutoFormatter( '---', 'horizontalLine' ) );
		autoFormat.add( 'bulletedList', new BlockAutoFormatter( '* ', 'bulletedList' ) );
		autoFormat.add( 'bulletedList -', new BlockAutoFormatter( '- ', 'bulletedList' ) );
		autoFormat.add( 'numberedList', new BlockAutoFormatter( '1. ', 'numberedList' ) );
		autoFormat.add( 'numberedList 1)', new BlockAutoFormatter( '1) ', 'numberedList' ) );
		autoFormat.add( 'todoList)', new BlockAutoFormatter( '[ ] ', 'todoList' ) );
		autoFormat.add( 'todoList 1)', new BlockAutoFormatter( '[] ', 'todoList' ) );

		// Headings
		{
			const command = this.editor.commands.get( 'heading' );
			if ( command ) {
				command.modelElements
					.filter( name => name.match( /^heading[1-6]$/ ) )
					.forEach( commandValue => {
						const level = commandValue[ 7 ];
						autoFormat.add( 'heading' + level, new BlockAutoFormatter( '#'.repeat( level ) + ' ',
							{ name: 'heading', params: { value: 'heading' + level } } ) );
					} );
			}
		}
	}
}

/**
 * Manages auto-formatting inside the editor.
 */
export class AutoFormatManager extends Map {
	/**
	 * Creates and instance of the AutoFormatManager class.
	 *
	 * @param editor {Editor} The editor.
	 */
	constructor( editor ) {
		super();

		const model = editor.model;

		// This variable will be filled on first change with the list of auto-formatters registered.
		let registeredAutoFormatters;

		// Sniff for typing that makes the text match one of the auto-formatting markers.
		model.document.on( 'change', ( evt, batch ) => {
			// Preliminary checks.
			if ( batch.type === 'transparent' || !model.document.selection.isCollapsed ) {
				return;
			}

			const changes = Array.from( model.document.differ.getChanges() );
			const change = changes[ 0 ];

			// Typing is represented by only a single change.
			if ( changes.length !== 1 || change.type !== 'insert' || change.name !== '$text' || change.length !== 1 ) {
				return;
			}

			// Do nothing if inside code.
			{
				const code = editor.commands.get( 'code' );
				const codeBlock = editor.commands.get( 'codeBlock' );

				if ( ( code && code.value ) || ( codeBlock && codeBlock.value ) ) {
					return;
				}
			}

			// Wait until the first change to check the list of commands available. This allows for adding
			// auto-formatters at any step the plugins initialization cycle.
			if ( !registeredAutoFormatters ) {
				registeredAutoFormatters = Array.from( this.values() ).filter( autoFormatter => {
					return !!editor.commands.get( autoFormatter.command.name );
				} );
			}

			if ( registeredAutoFormatters.length ) {
				// Check the changed text and call onMarker if it matches any auto-formatter.

				// The change may land either inside a textNode or as the first character of it (e.g. paragraph start).
				const textNode = change.position.textNode || change.position.nodeAfter;

				// Get the position following the change in the text node.
				const textOffset = change.position.offset - textNode.startOffset + 1;

				// Get the text until the change position plus one character (if any).
				const text = textNode.data.substr( 0, textOffset + 1 );

				// Go through all markers and check if ay of them match the text.
				registeredAutoFormatters.find( autoFormatter => {
					const match = text.match( autoFormatter.typingRegex );

					if ( match && editor.commands.get( autoFormatter.command.name ).isEnabled ) {
						let index = match.index;

						// The first matching group can be used to shift the index of the marker itself.
						match[ 1 ] && ( index += match[ 1 ].length );

						const position = model.createPositionAt( change.position.parent, textNode.startOffset + index );
						return autoFormatter.onMarker( editor, position );
					}
				} );
			}
		} );
	}

	/**
	 * Adds a new auto-formatter. It's an alias for set().
	 *
	 * @param key {String} The unique key of this auto-formatter.
	 * @param autoFormatter {AutoFormatter} The auto-formatter instance.
	 */
	add( key, autoFormatter ) {
		this.set( key, autoFormatter );
	}
}

/**
 * Base class for the implementation of auto-formatters.
 */
export class AutoFormatter {
	/**
	 * Creates an instance of the AutoFormatter class. This is a base class having no use standalone.
	 *
	 * @param marker {String} The marker used to activate this auto-formatter.
	 * @param command {String|Object} The command name associated or an object describing it.
	 * @param command.name {String} The command name.
	 * @param command.[params] {*} Parameter to be passed to the command execution (if relevant).
	 */
	constructor( marker, command ) {
		this.marker = marker;
		this.command = ( typeof command === 'string' ) ? { name: command } : command;

		/**
		 * The regex used to sniff the marker typing.
		 *
		 * @type {RegExp}
		 */
		this.typingRegex = new RegExp( escapeRegex( marker ) );
	}

	/**
	 * Called when the marker associated to this auto-formatter has been typed in the editor.
	 *
	 * @param editor {Editor} The editor.
	 * @param position {Position} The position of the first character of the marker.
	 *//* istanbul ignore next */
	onMarker( editor, position ) {
		if ( process.env.NODE_ENV !== 'production' ) {
			console.log( `Marker -> "${ this.marker }"`, position );
		}
	}
}

/**
 * Auto-formatter for inline formatting where the opening marker matches the closing marker (e.g. "**bold**").
 */
export class InlineAutoFormatter extends AutoFormatter {
	/**
	 * Creates and instance of the InlineAutoFormatter class.
	 */
	constructor( marker, command ) {
		super( marker, command );

		// Build the regex used to search for a closing match.
		// E.g.: /(^|[^\s|`])`[\s.,;:?!'")]?$/:
		//   > (Group) Anything which is not space or the first character of the marker.
		//   + Marker
		//   + Space or punctuation, if any.
		this.typingRegex = new RegExp( '(^|[^\\s|' + escapeRegex( marker[ 0 ] ) + '])' + escapeRegex( marker ) + '[\\s.,;:?!\'")]?$' );
	}

	/**
	 * @inheritDoc
	 */
	onMarker( editor, position ) {
		let textNode = position.textNode || position.nodeAfter;

		// Get the position following the change in the text node.
		const markerOffsetInTheText = position.offset - textNode.startOffset;

		// Get the text until the marker.
		let text = textNode.data.substr( 0, markerOffsetInTheText );

		const markerAttribs = Array.from( textNode.getAttributeKeys() );

		// Build the regex used to search for an opening match.
		// E.g.: /^\s`(?!`)[^\s]/:
		//   > Beginning of the string
		//   + Space or punctuation.
		//   + Marker
		//     - Followed by anything which is not the first character of the marker.
		//   + Anything which is not a space.
		const regex = new RegExp( '^[\\s\'"(]' + escapeRegex( this.marker ) + '(?!' + escapeRegex( this.marker[ 0 ] ) + ')[^\\s]' );

		while ( textNode && textNode.is( '$text' ) ) {
			let valid = textNode === position.textNode;

			if ( !valid ) {
				text = textNode.data;
				valid = compareAttributes( markerAttribs, Array.from( textNode.getAttributeKeys() ) );
			}

			if ( valid ) {
				const minimumLength = this.marker.length +
					1;	// minimum one character inside

				for ( let i = text.length - minimumLength; i >= 0; i-- ) {
					let partial = text.substr( i ? i - 1 : 0 ); // Include the character before, if available.
					if ( i === 0 ) {
						partial = ' ' + partial;
					}

					if ( regex.test( partial ) ) {
						const openerOffset = textNode.startOffset + i;
						const openerPosition = editor.model.createPositionAt( textNode.parent, openerOffset );

						format.call( this, openerPosition, position );

						return true;
					}
				}
			}

			textNode = textNode.previousSibling;
		}

		function format( openerPosition, closerPosition ) {
			const model = editor.model;

			const openerRange = LiveRange.fromRange(
				model.createRange( openerPosition, openerPosition.getShiftedBy( this.marker.length ) ) );
			const closerRange = LiveRange.fromRange(
				model.createRange( closerPosition, closerPosition.getShiftedBy( this.marker.length ) ) );
			const contentsRange = LiveRange.fromRange(
				model.createRange( openerRange.end, closerPosition ) );

			const selection = model.document.selection;
			const attribs = selection.getAttributes();

			model.enqueueChange( writer => {
				// Execute some operations before setSelection() to workaround the following issue:
				// https://github.com/ckeditor/ckeditor5/issues/6465
				writer.remove( closerRange );
				writer.remove( openerRange );

				writer.setSelection( contentsRange );
				editor.execute( this.command.name, this.command.params );
				writer.setSelection( contentsRange.end );

				// Remove all attributes in the selection now and add again those it had before the changes,
				// so the selection will be after the formatted text.
				writer.removeSelectionAttribute( selection.getAttributeKeys() );
				writer.setSelectionAttribute( new Map( attribs ) );

				openerRange.detach();
				closerRange.detach();
				contentsRange.detach();
			} );
		}

		function compareAttributes( ...attribsLists ) {
			// Take the first one as reference.
			const attribs = attribsLists.shift();

			// Search through the next lists for one that doesn't have exactly the same above attributes.
			return !attribsLists.find( otherAttribs => {
				// Ensure that the first node and this one have the very same formatting attributes.
				return otherAttribs.length !== attribs.length ||
					otherAttribs.find( otherAttrib => !attribs.includes( otherAttrib ) );
			} );
		}
	}
}

/**
 * Auto-formatter for blocks where the whole marker is typed in an empty paragraph (e.g. ">" for block-quote).
 */
export class BlockAutoFormatter extends AutoFormatter {
	/**
	 * @inheritDoc
	 */
	onMarker( editor, position ) {
		const block = position.parent;

		if ( !block.is( 'element', 'paragraph' ) ) {
			return;
		}

		const text = block.getChild( 0 ).data;
		const regex = new RegExp( '^' + escapeRegex( this.marker ) );

		if ( regex.test( text ) ) {
			editor.model.enqueueChange( writer => {
				const markerRange = LiveRange.fromRange(
					editor.model.createRange( position, position.getShiftedBy( this.marker.length ) ) );

				writer.remove( markerRange );

				editor.execute( this.command.name, this.command.params );
			} );

			return true;
		}
	}
}
