/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Command from '@ckeditor/ckeditor5-core/src/command';
import CodeBlock from '@ckeditor/ckeditor5-code-block/src/codeblock';
import ObservableMixin from '@ckeditor/ckeditor5-utils/src/observablemixin';

import DropdownButtonView from '@ckeditor/ckeditor5-ui/src/dropdown/button/dropdownbuttonview';
import BalloonPanelView from '@ckeditor/ckeditor5-ui/src/panel/balloon/balloonpanelview';
import FilteredListView from '../modules/filteredlistview';
import KeystrokeHandler from '@ckeditor/ckeditor5-utils/src/keystrokehandler';

import { languages, aliases, searchSource, languagesCount } from '../data/languages';
import mix from '@ckeditor/ckeditor5-utils/src/mix';
import clickOutsideHandler from '@ckeditor/ckeditor5-ui/src/bindings/clickoutsidehandler';
import { escapeRegex } from '../modules/util';

/**
 * Appends a language selector button to code-blocks created in the editor.
 */
export default class CodeBlockLanguageSelector extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ CodeBlock ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const model = editor.model;

		// This map will hold references between pre elements in the view and their relative language selection buttons.
		const map = new WeakMap();

		// Integration with the downcast dispacher.
		{
			// Append the button when a new code-block is inserted in the view.
			editor.editing.downcastDispatcher.on( 'insert:codeBlock', ( evt, data, conversionApi ) => {
				const { writer, mapper } = conversionApi;
				const codeBlock = data.item;
				const language = codeBlock.getAttribute( 'language' );

				// "Suggestion" code-blocks don't allow for specifying language, so we do nothing there.
				if ( language === 'suggestion' ) {
					return;
				}

				// Take the pre element from view, out of the codeBlock model element.
				const prePosition = mapper.toViewPosition( model.createPositionBefore( codeBlock ) );
				const pre = prePosition.nodeAfter;

				// Create the language selection button for it and attach it to the dom.
				const selector = new LanguageSelector( editor );
				selector.label = aliases[ language ] || language;
				selector.insertInto( pre, writer );

				// Update the model when a language is selected using the button.
				selector.on( 'language', ( evt, language ) => {
					let alias = languages[ language ];
					alias = alias ? alias[ 0 ] : language;

					model.change( writer => {
						writer.setAttribute( 'language', alias, codeBlock );
					} );

					editor.focus();
				} );

				// Save a reference between the pre element and the selector.
				map.set( pre, selector );
			}, {
				// Low priority because we want the view elements to be available already.
				priority: 'low'
			} );

			// Update the state of the button if its relative code-block changed language.
			editor.editing.downcastDispatcher.on( 'attribute:language:codeBlock', ( evt, data, conversionApi ) => {
				const mapper = conversionApi.mapper;

				const codeBlock = data.item;
				const prePosition = mapper.toViewPosition( model.createPositionBefore( codeBlock ) );
				const pre = prePosition.nodeAfter;

				const selector = map.get( pre );
				if ( selector ) {
					const language = data.attributeNewValue;
					selector.label = aliases[ language ] || language;
				}
			}, { priority: 'low' } );

			// Cleanup the dom from the button and its ballon if a code-block is removed.
			editor.editing.downcastDispatcher.on( 'remove:codeBlock', ( evt, data, conversionApi ) => {
				const mapper = conversionApi.mapper;

				const prePosition = mapper.toViewPosition( data.position );
				const pre = prePosition.nodeAfter;
				const selector = map.get( pre );

				if ( selector ) {
					selector.destroy();
					map.delete( pre );
				}
			}, { priority: 'high' } );
		}

		// Create and register the 'CodeBlockLanguageSelector' command.
		const command = new CodeBlockLanguageSelectorCommand( editor );
		{
			command.on( 'execute', () => {
				const selection = editor.editing.view.document.selection;

				// Search the ancestor tree until we find a pre mapped to a selector.
				const pre = selection.anchor.parent.getAncestors().find( node => map.has( node ) );
				const selector = pre && map.get( pre );

				// This `if` is just a safeguard but it should never be falsy.
				/* istanbul ignore else */
				if ( selector ) {
					selector.execute();
				}
			} );

			editor.commands.add( 'codeBlockLanguageSelector', command );
			editor.keystrokes.set( 'Ctrl+Shift+L', 'codeBlockLanguageSelector' );
		}
	}
}

/**
 * Activates the language selection button for a code block, if the selection is inside of it.
 */
export class CodeBlockLanguageSelectorCommand extends Command {
	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		const codeBlockCommand = editor.commands.get( 'codeBlock' );

		this.bind( 'isEnabled' ).to( codeBlockCommand, 'isEnabled', codeBlockCommand, 'value',
			( isEnabled, value ) => isEnabled && value !== false && value !== 'suggestion' );
	}

	/**
	 * @inheritDoc
	 */
	refresh() {
		// The refresh method must be overridden, otherwise isEnabled will always return `true`.
		// https://github.com/ckeditor/ckeditor5/issues/6589
	}
}

/**
 * A language selection button for code blocks.
 *
 * @mixes ObservableMixin
 */
export class LanguageSelector {
	/**
	 * Creates an instance of the LanguageSelector class for a given editor.
	 *
	 * @param editor {Editor} The CKEditor instance.
	 */
	constructor( editor ) {
		this.set( {
			/**
			 * The button label.
			 *
			 * @observable
			 * @member {String} #title
			 */
			label: 'Language',

			/**
			 * The keystroke displayed at the top of the selection list.
			 *
			 * @observable
			 * @member {String} #title
			 */
			keystroke: 'Ctrl+Shift+L'
		} );

		/**
		 * The button UI view.
		 *
		 * @type {LanguageSelectorButtonView}
		 */
		const buttonView = this.buttonView = new LanguageSelectorButtonView( editor );
		buttonView.bind( 'label', 'keystroke' ).to( this );

		/**
		 * Fired when a language has been selected.
		 *
		 * @event language
		 * @param language {String} The language.
		 */
		buttonView.delegate( 'language' ).to( this );
	}

	/**
	 * Creates the UI element for the button and insert it in the provided element in the view.
	 *
	 * @param targetViewElement {HTMLElement} The (pre) element, parent of the button.
	 * @param writer {DowncastWriter} The writer used to create the UI element {UIElement}.
	 */
	insertInto( targetViewElement, writer ) {
		const element = writer.createUIElement( 'button', null, () => {
			const buttonView = this.buttonView;

			if ( !buttonView.isRendered ) {
				buttonView.render();
			}

			return buttonView.element;
		} );

		writer.insert( writer.createPositionAt( targetViewElement, 'end' ), element );
	}

	/**
	 * Click the button.
	 */
	execute() {
		this.buttonView.fire( 'execute' );
	}

	/**
	 * Destroy the button, cleaning up the dom.
	 */
	destroy() {
		this.buttonView.destroy();
	}
}

mix( LanguageSelector, ObservableMixin );

/**
 * The UI button view for the language selector for code-blocks.
 */
export class LanguageSelectorButtonView extends DropdownButtonView {
	/**
	 * Creates and instance of the LanguageSelectorButtonView class.
	 *
	 * @param editor {Editor} The parent editor of this view.
	 */
	constructor( editor ) {
		super( editor.locale );

		/**
		 * The parent editor of this view.
		 *
		 * @type {Editor}
		 */
		this.editor = editor;

		// Setup the button.
		{
			this.set( {
				// Tooltip doesn't show up because of pre{ overflow:hidden}.
				// tooltip: 'Change the code block language',
				// tooltipPosition: 'n',

				withText: true,
				isToggleable: true
			} );

			this.extendTemplate( {
				attributes: {
					class: 'ck-codeblock-language-button',
					contenteditable: 'false'
				}
			} );
		}

		// Setup the balloon.
		const balloonView = this.balloonView = new LanguageSelectorBalloonView( editor );
		{
			this.on( 'language', () => balloonView.unpin() );
			this.bind( 'isOn' ).to( balloonView, 'isVisible' );

			/**
			 * Fired when a language has been selected.
			 *
			 * @event language
			 * @param language {String} The language.
			 */
			balloonView.delegate( 'language' ).to( this );
		}

		this.on( 'execute', () => {
			if ( balloonView.isVisible ) {
				balloonView.unpin();
				editor.focus();
			} else {
				const positions = BalloonPanelView.defaultPositions;

				balloonView.pin( {
					target: this.element,
					// Unfortunately the default positions are all "arrow compatible" so we have to fix them.
					// Setting the offset properties to 0 would be ideal, but those are static an we
					// don't know where else they're used.
					positions: [
						( ...args ) => {
							const pos = positions.southEastArrowNorthEast( ...args );
							pos.top -= BalloonPanelView.arrowVerticalOffset;
							pos.left -= BalloonPanelView.arrowHorizontalOffset;
							return pos;
						},
						( ...args ) => {
							const pos = positions.southWestArrowNorthWest( ...args );
							pos.top -= BalloonPanelView.arrowVerticalOffset;
							pos.left += BalloonPanelView.arrowHorizontalOffset;
							return pos;
						}
					]
				} );
			}
		} );
	}

	/**
	 * @inheritDoc
	 */
	render() {
		super.render();

		// Remove this button from the balloon auto closing logic.
		this.balloonView.clickContextElements.push( this.element );
	}

	/**
	 * @inheritDoc
	 */
	destroy() {
		super.destroy();
		this.balloonView.destroy();
	}
}

/**
 * The balloon view of the language selector for code-blocks.
 */
export class LanguageSelectorBalloonView extends BalloonPanelView {
	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor.locale );

		/**
		 * The editor instance holding this balloon.
		 */
		this.editor = editor;

		this.class = 'ck-codeblock-language-balloon select-menu-modal';
		this.withArrow = false;

		/**
		 * Elements which, when clicked, will not make the balloon hide.
		 *
		 * @default [ this.element ]
		 * @type {HTMLElement[]}
		 */
		this.clickContextElements = [];

		// Add the search list into the balloon.
		const searchView = new LanguageSearchView( editor.locale );
		this.content.add( searchView );

		// Focus in the search field on balloon show.
		this.on( 'change:isVisible', ( eventInfo, name, isVisible ) =>
			( isVisible && searchView.focus() ), { priority: 'low' } );

		/**
		 * Fired when a language has been selected.
		 *
		 * @event language
		 * @param language {String} The language.
		 */
		searchView.delegate( 'language' ).to( this );
	}

	/**
	 * @inheritDoc
	 */
	render() {
		super.render();

		// Add the balloon to the DOM, at root level.
		this.editor.ui.view.body.add( this );

		// Close on ESC.
		{
			const keystrokes = new KeystrokeHandler();

			keystrokes.set( 'esc', () => {
				this.unpin();
				this.editor.focus();
			} );

			keystrokes.listenTo( this.element );
		}

		// Close when clicking outside.
		{
			this.clickContextElements.push( this.element );

			clickOutsideHandler( {
				emitter: this,
				activator: () => this.isVisible,
				contextElements: this.clickContextElements,
				callback: () => this.unpin()
			} );
		}
	}

	/**
	 * @inheritDoc
	 */
	show() {
		if ( !this.isRendered ) {
			this.render();
		}

		super.show();
	}

	/**
	 * @inheritDoc
	 */
	destroy() {
		if ( this.isRendered ) {
			this.editor.ui.view.body.remove( this );
		}

		super.destroy();
	}
}

/**
 * The UI view for the language search list and filtering.
 */
export class LanguageSearchView extends FilteredListView {
	/**
	 * @inheritDoc
	 */
	constructor( locale ) {
		super( locale );

		this.title = 'Select a language';
		this.keystroke = 'Ctrl+Shift+L';
		this.filterInputView.placeholder = 'Filter languages...';

		/**
		 * Fired when a language has been selected.
		 *
		 * @event language
		 * @param language {String} The language.
		 */
		this.on( 'execute', ( ev, data ) => this.fire( 'language', data.label ) );
	}

	/**
	 * @inheritDoc
	 */
	query( filter ) {
		// Reset the footer.
		this.footer = '';

		const results = [];

		// The number of languages we want to show in the list. This will not limit the search total.
		const max = 5;

		if ( filter ) {
			// Create the regex patterns that will be used for the search. They go in priority order.
			// The patterns are made in a way so the capturing group is the name of the language matched.
			filter = escapeRegex( filter.toLowerCase() );
			const patterns = [
				`[>,]${ filter }(?:,.*)?\\|(.*)`,	// full match
				`>${ filter }.*\\|(.*)`,			// name starts with
				`,${ filter }.*\\|(.*)`,			// any alias starts with
				`${ filter }.*\\|(.*)`				// anywhere
			];

			// Execute all patterns.
			while ( patterns.length ) {
				const regex = new RegExp( patterns.shift(), 'gm' );
				let match;

				// Add all matched languages, except those already matched.
				while ( ( match = regex.exec( LanguageSearchView.searchSource ) ) ) {
					if ( !results.includes( match[ 1 ] ) ) {
						results.push( match[ 1 ] );
					}
				}
			}

			// Setup the footer, according to the number of languages found.
			if ( !results.length ) {
				this.footer = 'No languages found';
			} else if ( results.length > max ) {
				const excess = results.length - max;
				if ( excess === 1 ) {
					this.footer = `... 1 more language found`;
				} else {
					this.footer = `... ${ excess } more languages found`;
				}
			}
		} else {
			// Default to some of the most popular languages in GitHub.
			results.push(
				'JavaScript',
				'Java',
				'PHP',
				'Python',
				'TypeScript'
			);

			this.footer = `... ${ languagesCount - results.length } more languages available`;
		}

		// Return `max` (or less) number of languages.
		return results.slice( 0, max ).map( language => {
			// The item label is the language itself.
			const entry = { label: language };

			// Add the aliases in the description, if any.
			{
				let aliases = languages[ language ];

				if ( aliases && aliases[ 0 ] === language.toLowerCase() ) {
					aliases = aliases.slice( 1 );
				}

				if ( aliases && aliases.length ) {
					entry.description = `(${ aliases.join( ', ' ) })`;
				}
			}

			return entry;
		} );
	}
}

LanguageSearchView.searchSource = searchSource;
