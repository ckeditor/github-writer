/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import WordFinder from './wordfinder';

import { viewToModelPositionOutsideModelElement } from '@ckeditor/ckeditor5-widget/src/utils';
import { emojis } from '../data/emojis';
import { isEmojiSupported } from '../modules/util';
import priorities from '@ckeditor/ckeditor5-utils/src/priorities';

/*
	The work done by this plugin is, in theory, simple:

	In editing:
		1. Watch for typing, loading or pasting of text that matches the emoji typing format (e.g. `:smiley:`).
		2. Mark the matched text using the WordFinder plugins.
		3. Replace marked text with the {emoji} element.

	In data downcast:
		1. Replace {emoji} elements with a plain inline element, e.g. <span>:smiley:</span>.
		2. The markdown DP will take care of stripping the <span>, leaving just `:smiley:` in the output.

	 But in reality this is quite a delicate code as it makes several changes to the model
	 while other many changes are being done by other plugins and the editor itself.
*/

/**
 * Enables the inline rendering of emojis text. For example, the text `:smiley:` will be seen
 * as an emoji during editing but it'll be output without change as plain text.
 */
export default class Emoji extends Plugin {
	static get requires() {
		return [ WordFinder ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		// Register a word finder for emojis.
		this.editor.wordFinder.add( {
			type: 'emoji',
			pattern: /:\S+:/,
			callback: match => {
				// Checks if an emoji exists.
				const name = match.text.replace( /:/g, '' );
				return !!emojis[ name ];
			}
		} );

		// Schema and conversion.
		{
			// The above marked text will be transformed to the following inline element.
			editor.model.schema.register( 'emoji', {
				allowWhere: '$text',
				isInline: true,
				isObject: true,
				allowAttributes: [ 'name' ]
			} );

			// Downcast is defined for editing only, because we want the plain-text only in the data output,
			// which is the whole point of auto-linking, in fact.
			editor.conversion.for( 'editingDowncast' ).elementToElement( {
				model: 'emoji',
				view: ( modelElement, viewWriter ) => {
					const name = modelElement.getAttribute( 'name' );
					const emojiInfo = emojis[ name ];

					const gEmoji = viewWriter.createContainerElement( 'g-emoji', {
						'contenteditable': 'false',
						'alias': name
					} );

					if ( isEmojiSupported && emojiInfo.unicode ) {
						const viewText = viewWriter.createText( emojiInfo.unicode );
						viewWriter.insert( viewWriter.createPositionAt( gEmoji, 0 ), viewText );
					} else {
						const image = viewWriter.createEmptyElement( 'img', {
							'class': 'emoji',
							'height': '20',
							'width': '20',
							'align': 'absmiddle',
							'alt': `:${ name }:`,
							'src': emojiInfo.url
						} );
						viewWriter.insert( viewWriter.createPositionAt( gEmoji, 0 ), image );
					}

					return gEmoji;
				}
			} );

			editor.conversion.for( 'dataDowncast' ).elementToElement( {
				model: 'emoji',
				view: ( modelElement, viewWriter ) => {
					// It's not possible to downcast an element to plain text, so we wrap the text in a <span>.
					// This <span> will be in any case stripped out when converting the data to markdown on output.
					const emoji = viewWriter.createContainerElement( 'span' );

					const viewText = viewWriter.createText( `:${ modelElement.getAttribute( 'name' ) }:` );
					viewWriter.insert( viewWriter.createPositionAt( emoji, 0 ), viewText );

					return emoji;
				}
			} );

			// Upcasting is not necessary when loading data but it has two goals:
			// 	1. Avoid the editor lose content on some situations, like when pressing space after the emoji.
			//  2. Make it possible to paste content from GH which contains emojis.
			{
				// Convert <g-emoji>.
				editor.conversion.for( 'upcast' ).elementToElement( {
					view: 'g-emoji',
					model: ( viewElement, modelWriter ) => {
						const name = viewElement.getAttribute( 'alias' );
						return createEmojiElement( name, modelWriter );
					}
				} );

				// Convert <img class="emoji"> (see next conversion.for( 'upcast' ) for exception)
				editor.conversion.for( 'upcast' ).elementToElement( {
					view: 'img',
					model: ( viewElement, modelWriter ) => {
						if ( viewElement.hasClass( 'emoji' ) ) {
							let name = viewElement.getAttribute( 'alt' );
							name = name && name.replace( /:/g, '' );

							if ( emojis[ name ] ) {
								return createEmojiElement( name, modelWriter );
							}
						}
					},
					converterPriority: 'highest'
				} );

				// But remove <img class="emoji"> inside <g-emoji> from conversion.
				editor.conversion.for( 'upcast' ).add( dispatcher => {
					dispatcher.on( 'element:img', ( evt, data, conversionApi ) => {
						const element = data.viewItem;

						if ( element.hasClass( 'emoji' ) ) {
							if ( element.parent && element.parent.is( 'g-emoji' ) ) {
								conversionApi.consumable.consume( element, { name: true } );
								evt.stop();
							}
						}
					}, { priority: priorities.highest + 1 } );
				} );
			}

			editor.editing.mapper.on( 'viewToModelPosition',
				viewToModelPositionOutsideModelElement( editor.model, viewElement => viewElement.name === 'g-emoji' )
			);

			// The {word="emoji:..."} => {emoji} conversion is a two step process:
			//		1. Use a post-fixer to catch all changes. Search for {word="emoji:..."} changes
			//		   and put them in a list to be processed by "2".
			//		2. Wait for the view#render event and process the changes.
			{
				const pendingEmojis = [];

				editor.model.document.registerPostFixer( postFixWriter => {
					const changes = editor.model.document.differ.getChanges();

					changes.forEach( change => {
						if ( change.type === 'attribute' && change.attributeKey === 'word' &&
							change.attributeNewValue && change.attributeNewValue.startsWith( 'emoji:' ) ) {
							const node = change.range.start.nodeAfter;
							pendingEmojis.push( [ node, postFixWriter.batch ] );
						}
					} );
				} );

				// TODO: this listener is called too often. We just need it if there are pendingEmojis.
				// Wait for the very last moment (render) to make changes, to avoid conflict
				// with other plugins that are manipulating the same part of the dom.
				editor.editing.view.on( 'render', () => {
					let text, batch;

					while ( pendingEmojis.length && ( [ text, batch ] = pendingEmojis.pop() ) ) {
						editor.model.enqueueChange( batch, writer => {
							// Check for parent, just for safety, but we don't have a clear case for it.
							/* istanbul ignore else */
							if ( text && text.parent ) {
								const value = text.getAttribute( 'word' );

								if ( value ) {
									const [ , name ] = value.match( /^emoji::(.+):$/ );
									const emoji = createEmojiElement( name, writer );
									writer.insert( emoji, text, 'before' );
									writer.remove( text );
								}
							}
						} );
					}
				}, { priority: 'high' } );
			}
		}
	}
}

/**
 * @param name {String} Emoji name.
 * @param writer {module:engine/model/writer-Writer} Model writer used to create the element.
 * @returns {module:engine/model/element~Element}
 */
function createEmojiElement( name, writer ) {
	return writer.createElement( 'emoji', { name } );
}
