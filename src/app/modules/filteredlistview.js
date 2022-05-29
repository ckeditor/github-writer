/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import View from '@ckeditor/ckeditor5-ui/src/view';
import ListView from '@ckeditor/ckeditor5-ui/src/list/listview';
import ListItemView from '@ckeditor/ckeditor5-ui/src/list/listitemview';

import InputTextView from '@ckeditor/ckeditor5-ui/src/inputtext/inputtextview';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import Template from '@ckeditor/ckeditor5-ui/src/template';

import KeystrokeHandler from '@ckeditor/ckeditor5-utils/src/keystrokehandler';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';

/**
 * A generic list view with a search box, simulating the list provided by GH with the Saved Replies feature.
 */
export default class FilteredListView extends View {
	/**
	 * @inheritDoc
	 */
	constructor( locale ) {
		super( locale );

		/**
		 * The title displayed at the top of the list.
		 *
		 * @observable
		 * @member {String} #title
		 */
		this.set( 'title', 'Select an option' );

		/**
		 * The keystroke to show next to the title. This is usually the keystroke that shows up this list.
		 * It follows the CKEditor 5 conventions for keystrokes.
		 *
		 * If empty, no keystroke is displayed.
		 *
		 * @observable
		 * @member {String} #keystroke
		 */
		this.set( 'keystroke' );

		/**
		 * The footer text.
		 *
		 * If empty, no footer is displayed.
		 *
		 * @observable
		 * @member {String} #title
		 */
		this.set( 'footer' );

		const bind = this.bindTemplate;

		// Class names and dom used here come from the "Saved replies" modal.

		// Data in this collection is bound to the list items.
		const items = new Collection();

		const list = new ListView( this.locale );
		{
			// Bind the items in the list to the collection.
			list.items.bindTo( items ).using( data => {
				const listItem = new ListItemView( this.locale );

				// A custom view creation function can be provided for this item.
				if ( data.createView ) {
					listItem.children.add( data.createView.call( this ) );
				} else {
					const listItemButton = new ButtonView( this.locale );
					{
						listItemButton.withText = true;
						listItemButton.tabindex = 0;
						listItemButton.class = 'select-menu-item width-full d-flex';
						listItemButton.on( 'execute', () => this.fire( 'execute', data ) );

						if ( data.key ) {
							this.itemsKeystrokes.set( data.key, () => listItemButton.fire( 'execute' ) );
						}
					}

					// Label
					{
						listItemButton.label = data.label;

						listItemButton.labelView.extendTemplate( {
							attributes: {
								class: 'select-menu-item-heading flex-auto css-truncate css-truncate-target'
							}
						} );

						if ( data.description ) {
							const labelTemplate = listItemButton.labelView.template;

							// A space.
							labelTemplate.children.push( new Template( { text: ' ' } ) );

							// The aliases, in the format "(alias1, alias2)".
							labelTemplate.children.push( new Template( {
								tag: 'span',
								attributes: {
									class: 'description css-truncate css-truncate-target'
								},
								children: [ data.description ]
							} ) );
						}
					}

					// Key
					{
						if ( data.key ) {
							listItemButton.template.children.push( new Template( {
								tag: 'code',
								children: [
									{
										tag: 'span',
										attributes: {
											class: 'border rounded-1 p-1'
										},
										children: [ getKeystrokeLabel( data.key ) ]
									} ]
							} ) );
						}
					}

					listItem.children.add( listItemButton );
				}

				list.items.add( listItem );
			} );
		}

		const filterInput = this.filterInputView = new InputTextView( this.locale );
		{
			filterInput.placeholder = 'Filter...';
			filterInput.extendTemplate( {
				attributes: {
					class: 'form-control width-full'
				}
			} );
			filterInput.on( 'input', () => executeQuery( filterInput.element.value ) );

			const keystroke = new KeystrokeHandler();
			keystroke.set( 'ArrowDown', evt => {
				list.focus();

				// The following both avoids page jump and make it work in the Saved Replies case.
				evt.preventDefault();
				evt.stopPropagation();
			} );
			filterInput.on( 'render', () => keystroke.listenTo( filterInput.element ), { priority: 'low' } );
		}

		this.setTemplate( {
			tag: 'div',
			attributes: {
				class: 'ck-filteredlist'
			},
			children: [
				// Header
				{
					tag: 'div',
					attributes: {
						class: 'select-menu-header d-flex'
					},
					children: [
						{
							tag: 'span',
							attributes: {
								class: 'select-menu-title flex-auto'
							},
							children: [ {
								text: bind.to( 'title' )
							} ]
						},
						{
							tag: 'code',
							attributes: {
								style: {
									display: bind.to( 'keystroke', value => value ? false : 'none' )
								}
							},
							children: [
								{
									tag: 'span',
									attributes: {
										class: 'border rounded-1 p-1'
									},
									children: [ {
										text: bind.to( 'keystroke', value => value ? getKeystrokeLabel( value ) : '' )
									} ]
								}
							]
						}
					]
				},

				// Filter
				{
					tag: 'div',
					attributes: {
						class: 'select-menu-filters border-bottom p-2'
					},
					children: [
						filterInput
					]
				},

				// List
				{
					tag: 'div',
					attributes: {
						class: 'select-menu-list'
					},
					children: [
						list
					]
				},

				// Footer
				{
					tag: 'div',
					attributes: {
						class: 'select-menu-header select-menu-footer',
						style: {
							display: bind.to( 'footer', value => value ? false : 'none' )
						}
					},
					children: [
						{ text: bind.to( 'footer' ) }
					]
				}
			]
		} );

		// Bootstrap the list.
		this.once( 'render', () => executeQuery( '' ), { priority: 'low' } );

		const that = this;

		/**
		 * Cleans up the list, calls `query()` and adds the retrieved items to the collection.
		 *
		 * @param filter {String} The string used to filter the query.
		 */
		function executeQuery( filter ) {
			// Reset
			{
				resetItemKeystrokes();

				while ( items.length ) {
					items.remove( 0 );
				}

				while ( list.items.length ) {
					list.items.remove( 0 );
				}
			}

			// Query and update list.
			{
				Promise.resolve( that.query( filter ) )
					.then( results => {
						results.forEach( ( data, index ) => {
							// Automatically provides an access key for the first nine items.
							if ( index < 9 ) {
								data.key = 'Ctrl+' + ( index + 1 );
							}
							items.add( data );
						} );
					} );
			}

			/**
			 * Stop listening to keystrokes for the items.
			 */
			function resetItemKeystrokes() {
				let keystrokes = that.itemsKeystrokes;

				if ( keystrokes ) {
					keystrokes.destroy();
				}

				keystrokes = that.itemsKeystrokes = new KeystrokeHandler();

				keystrokes.listenTo( that.element );
			}
		}

		/**
		 * Fired when one of the items has been chosen by the user.
		 *
		 * @event execute
		 * @param data {Object} The raw data associated to the item, as provided by the `query()` method implementation.
		 */
	}

	/**
	 * Retrieves an array with data associated to the items to be displayed in the list, based on the provided filter.
	 *
	 * Every entry can have the following properties:
	 *     - label {String} The item label. Optional if `createView` is provided.
	 *     - [description] {String} Additional text that goes together with the label.
	 *     - [createView] {Function} A function that takes the responsibility of creating and returning the item view.
	 *     - ...[anything else] Any other properties to be passed along with the data.
	 *
	 * The `execute` event is fired with the above data when the user selects an item.
	 *
	 * @protected
	 * @param filter {String} The query filter.
	 * @returns {Object[]} A list which every entry provides data for the items creation.
	 */
	// eslint-disable-next-line no-unused-vars
	query( filter ) {
		// To be provided by child classes.
		return [];
	}

	/**
	 * Focus this view, actually moving the focus and selecting the text of the filter input field.
	 */
	focus() {
		const filterInput = this.filterInputView;

		// setTimeout to avoid page jump.
		setTimeout( () => filterInput.select(), 0 );
	}
}

/**
 *
 * @param keystroke {String}
 * @returns {String}
 */
function getKeystrokeLabel( keystroke ) {
	return keystroke.replace( /[+](?=[^+]+$)/, ' ' ).toLowerCase();
}
