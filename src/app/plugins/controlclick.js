/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import KeyStyler from './keystyler';

/**
 * Enables opening the target of links and autolinks in a new window by using ctrl/cmd+click.
 */
export default class ControlClick extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ KeyStyler ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		// Setup proper CSS styling when the ctrl/cmd key is pressed (controlclick.css).
		editor.keyStyler.add( 'Control', 'github-rte-key-ctrl' );
		editor.keyStyler.add( 'Meta', 'github-rte-key-ctrl' );

		// On downcast, add the 'data-control-click' attribute to elements that should open on click.
		editor.conversion.for( 'editingDowncast' ).add( dispatcher => {
			// Enable the feature on links and autolinks.
			wrapControlClick( 'linkHref', 'a', 'href' );
			wrapControlClick( 'autolink', 'autolink', 'data-url' );

			/**
			 * Adds the 'data-control-click' dom attribute to the downcast of a specific model attribute.
			 * @param attribute {String} The model attribute name.
			 * @param element {String} The dom element used for downcast.
			 * @param urlAttribute {String} The name of the attribute that holds the url to be opened on click.
			 */
			function wrapControlClick( attribute, element, urlAttribute ) {
				dispatcher.on( 'attribute:' + attribute, ( evt, data, conversionApi ) => {
					const viewWriter = conversionApi.writer;

					// Adding a new dom attribute is done by wrapping all ranges and selection in a new attribute
					// element with that attribute.
					// Use priority 5 because it is used by the link feature downcasting. In this way, the wrap
					// will actually merge it.
					const viewElement = viewWriter.createAttributeElement( element, {
						'data-control-click': urlAttribute
					}, { priority: 5 } );

					// Wrap it differently, depending on the kind of item received.
					if ( data.item.is( 'selection' ) ) {
						const viewSelection = viewWriter.document.selection;
						viewWriter.wrap( viewSelection.getFirstRange(), viewElement );
					} else {
						viewWriter.wrap( conversionApi.mapper.toViewRange( data.range ), viewElement );
					}
				}, { priority: 'low' } );
			}
		} );

		editor.ready.then( () => {
			// CKEditor stops the event chain on 'mousedown', so we can't use 'click'.
			editor.ui.getEditableElement().addEventListener( 'mousedown', ev => {
				// Check if the control key is active.
				if ( editor.keyStyler.isActive( 'Control' ) ) {
					// Get the "control-click" enabled element clicked, if any.
					const ccElement = ev.target.closest( '[data-control-click]' );
					if ( ccElement ) {
						const urlAttribute = ccElement.getAttribute( 'data-control-click' );
						const url = ccElement.getAttribute( urlAttribute );
						window.open( url, '_blank', 'noopener' );
						ev.preventDefault();
					}
				}
			} );
		} );
	}
}
