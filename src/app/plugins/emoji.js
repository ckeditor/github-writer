/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { WordMatchStyler } from './autolinking';

import { viewToModelPositionOutsideModelElement } from '@ckeditor/ckeditor5-widget/src/utils';
import { emojis } from '../data/emojis';
import { isEmojiSupported } from '../util';
import priorities from '@ckeditor/ckeditor5-utils/src/priorities';

/*
	The work done by this plugin is, in theory, simple:

	In editing:
		1. Watch for typing, loading or pasting of text that matches the emoji typing format (e.g. `:smiley:`).
		2. Mark the matched text with the {emoji-text} attribute.
		3. Replace marked text {emoji-text} with the {emoji} element.

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
	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		// Create the watcher that will match emoji text (like ":smiley:").
		{
			const styler = new WordMatchStyler( 'emoji-text' );
			styler.addMatcher( /:\S+:/, ( { text } ) => {
				// Checks if an emoji exists for the match.
				const name = text.replace( /:/g, '' );
				return !!emojis[ name ];
			} );
			styler.watch( editor );
		}

		// Schema and conversion.
		{
			// The text version of emojis (:smiley:) will be marked with this attribute.
			editor.model.schema.extend( '$text', { allowAttributes: 'emoji-text' } );
			editor.model.schema.setAttributeProperties( 'emoji-text', {
				isFormatting: false,
				copyOnEnter: false
			} );

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

			// The {emoji-text} => {emoji} conversion is a two step process:
			//		1. Use a post-fixer to catch all changes. Search for {emoji-text} changes
			//		   and put them in a list to be processed by "2".
			//		2. Wait for the view#render event and process the changes.
			{
				const pendingEmojis = [];

				editor.model.document.registerPostFixer( postFixWriter => {
					const changes = editor.model.document.differ.getChanges();

					changes.forEach( change => {
						if ( change.type === 'attribute' && change.attributeKey === 'emoji-text' && change.attributeNewValue ) {
							const node = change.range.start.nodeAfter;
							pendingEmojis.push( [ node, postFixWriter.batch ] );
						}
					} );
				} );

				// Wait for the very last moment (render) to make changes, to avoid conflict
				// with other plugins that are manipulating the same part of the dom.
				editor.editing.view.on( 'render', () => {
					let text, batch;

					while ( pendingEmojis.length && ( [ text, batch ] = pendingEmojis.pop() ) ) {
						editor.model.enqueueChange( batch, writer => {
							// Check for parent, just for safety, but we don't have a clear case for it.
							/* istanbul ignore else */
							if ( text && text.parent ) {
								const att = text.getAttribute( 'emoji-text' );

								if ( att && att.enabled ) {
									const name = att.text.replace( /:/g, '' );
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
