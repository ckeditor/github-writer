/**
 * @module mermaid/mermaidui
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import WidgetToolbarRepository from '@ckeditor/ckeditor5-widget/src/widgettoolbarrepository';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';
import Command from '@ckeditor/ckeditor5-core/src/command';

import mermaid from 'mermaid/dist/mermaid';
import { debounce } from 'lodash-es';

import insertMermaidIcon from '../theme/icons/insert.svg';
import previewModeIcon from '../theme/icons/previewMode.svg';
import splitModeIcon from '../theme/icons/splitMode.svg';
import sourceModeIcon from '../theme/icons/sourceMode.svg';
import infoIcon from '../theme/icons/info.svg';

import '../theme/mermaid.css';

 /* global window */

 class MermaidUI extends Plugin {
	 /**
	  * @inheritDoc
	  */
	 static get pluginName() {
		 return 'MermaidUI';
	 }

	 /**
	  * @inheritDoc
	  */
	 init() {
		 this._addButtons();
	 }

	 /**
	  * Adds all mermaid-related buttons.
	  *
	  * @private
	  */
	 _addButtons() {
		 const editor = this.editor;

		 this._addInsertMermaidButton();
		 this._addMermaidInfoButton();
		 this._createToolbarButton( editor, 'mermaidPreview', 'Preview', previewModeIcon );
		 this._createToolbarButton( editor, 'mermaidSourceView', 'Source view', sourceModeIcon );
		 this._createToolbarButton( editor, 'mermaidSplitView', 'Split view', splitModeIcon );
	 }

	 /**
	  * Adds the button for inserting mermaid.
	  *
	  * @private
	  */
	 _addInsertMermaidButton() {
		 const editor = this.editor;
		 const t = editor.t;

		 editor.ui.componentFactory.add( 'Mermaid', locale => {
			 const buttonView = new ButtonView( locale );
			 const command = editor.commands.get( 'insertMermaidCommand' );

			 buttonView.set( {
				 label: t( 'Insert Mermaid' ),
				 icon: insertMermaidIcon,
				 tooltip: true
			 } );

			 buttonView.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

			 // Execute the command when the button is clicked.
			 command.listenTo( buttonView, 'execute', () => {
				 editor.execute( 'insertMermaidCommand' );
				 editor.editing.view.scrollToTheSelection();
				 editor.editing.view.focus();
			 } );

			 return buttonView;
		 } );
	 }

	 /**
	  * Adds the button linking to the mermaid guide.
	  *
	  * @private
	  */
	 _addMermaidInfoButton() {
		 const editor = this.editor;
		 const t = editor.t;

		 editor.ui.componentFactory.add( 'mermaidInfo', locale => {
			 const buttonView = new ButtonView( locale );
			 const link = 'https://mermaid-js.github.io/mermaid/#/flowchart';

			 buttonView.set( {
				 label: t( 'Mermaid info' ),
				 icon: infoIcon,
				 tooltip: true
			 } );

			 buttonView.on( 'execute', () => {
				 window.open( link, '_blank', 'noopener' );
			 } );

			 return buttonView;
		 } );
	 }

	 /**
	  * Adds the mermaid balloon toolbar button.
	  *
	  * @private
	  * @param {module:core/editor/editor~Editor} editor
	  * @param {String} name Name of the button.
	  * @param {String} label Label for the button.
	  * @param {String} icon The button icon.
	  */
	 _createToolbarButton( editor, name, label, icon ) {
		 const t = editor.t;

		 editor.ui.componentFactory.add( name, locale => {
			 const buttonView = new ButtonView( locale );
			 const command = editor.commands.get( `${ name }Command` );

			 buttonView.set( {
				 label: t( label ),
				 icon,
				 tooltip: true
			 } );

			 buttonView.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

			 // Execute the command when the button is clicked.
			 command.listenTo( buttonView, 'execute', () => {
				 editor.execute( `${ name }Command` );
				 editor.editing.view.scrollToTheSelection();
				 editor.editing.view.focus();
			 } );

			 return buttonView;
		 } );
	 }
 }

 export default class Mermaid extends Plugin {
	 /**
	  * @inheritDoc
	  */
	 static get requires() {
		 return [ MermaidEditing, MermaidToolbar, MermaidUI ];
	 }

	 /**
	  * @inheritDoc
	  */
	 static get pluginName() {
		 return 'Mermaid';
	 }
 }

 class MermaidToolbar extends Plugin {
	 /**
	  * @inheritDoc
	  */
	 static get requires() {
		 return [ WidgetToolbarRepository ];
	 }

	 /**
	  * @inheritDoc
	  */
	 static get pluginName() {
		 return 'MermaidToolbar';
	 }

	 /**
	  * @inheritDoc
	  */
	 afterInit() {
		 const editor = this.editor;
		 const t = editor.t;

		 const widgetToolbarRepository = editor.plugins.get( WidgetToolbarRepository );
		 const mermaidToolbarItems = [ 'mermaidSourceView', 'mermaidSplitView', 'mermaidPreview', '|', 'mermaidInfo' ];

		 if ( mermaidToolbarItems ) {
			 widgetToolbarRepository.register( 'mermaidToolbar', {
				 ariaLabel: t( 'Mermaid toolbar' ),
				 items: mermaidToolbarItems,
				 getRelatedElement: selection => getSelectedElement( selection )
			 } );
		 }
	 }
 }

 function getSelectedElement( selection ) {
	 const viewElement = selection.getSelectedElement();

	 if ( viewElement && viewElement.hasClass( 'ck-mermaid__wrapper' ) ) {
		 return viewElement;
	 }

	 return null;
 }


/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module mermaid/utils
 */

/**
 * Helper function for setting the `isOn` state of buttons.
 *
 * @private
 * @param {module:core/editor/editor~Editor} editor
 * @param {String} commandName Short name of the command.
 * @returns {Boolean}
 */
export function checkIsOn( editor, commandName ) {
	const selection = editor.model.document.selection;
	const mermaidItem = selection.getSelectedElement() || selection.getLastPosition().parent;

	if ( mermaidItem && mermaidItem.is( 'element', 'mermaid' ) && mermaidItem.getAttribute( 'displayMode' ) === commandName ) {
		return true;
	}

	return false;
}


 // Time in milliseconds.
 const DEBOUNCE_TIME = 300;

 /* global window */

 class MermaidEditing extends Plugin {
	 /**
	  * @inheritDoc
	  */
	 static get pluginName() {
		 return 'MermaidEditing';
	 }

	 /**
	  * @inheritDoc
	  */
	 init() {
		 this._registerCommands();
		 this._defineConverters();
	 }

	 /**
	  * @inheritDoc
	  */
	 afterInit() {
		 this.editor.model.schema.register( 'mermaid', {
			 allowAttributes: [ 'displayMode', 'source' ],
			 allowWhere: '$block',
			 isObject: true
		 } );
	 }

	 /**
	  * @inheritDoc
	 */
	 _registerCommands() {
		 const editor = this.editor;

		 editor.commands.add( 'mermaidPreviewCommand', new MermaidPreviewCommand( editor ) );
		 editor.commands.add( 'mermaidSplitViewCommand', new MermaidSplitViewCommand( editor ) );
		 editor.commands.add( 'mermaidSourceViewCommand', new MermaidSourceViewCommand( editor ) );
		 editor.commands.add( 'insertMermaidCommand', new InsertMermaidCommand( editor ) );
	 }

	 /**
	  * Adds converters.
	  *
	  * @private
	  */
	 _defineConverters() {
		 const editor = this.editor;

		 editor.data.downcastDispatcher.on( 'insert:mermaid', this._mermaidDataDowncast.bind( this ) );
		 editor.editing.downcastDispatcher.on( 'insert:mermaid', this._mermaidDowncast.bind( this ) );
		 editor.editing.downcastDispatcher.on( 'attribute:source:mermaid', this._sourceAttributeDowncast.bind( this ) );

		 editor.data.upcastDispatcher.on( 'element:code', this._mermaidUpcast.bind( this ), { priority: 'high' } );

		 editor.conversion.for( 'editingDowncast' ).attributeToAttribute( {
			 model: {
				 name: 'mermaid',
				 key: 'displayMode'
			 },
			 view: modelAttributeValue => ( {
				 key: 'class',
				 value: 'ck-mermaid__' + modelAttributeValue + '-mode'
			 } )
		 } );
	 }

	 /**
	  *
	  * @private
	  * @param {*} evt
	  * @param {*} data
	  * @param {*} conversionApi
	  */
	 _mermaidDataDowncast( evt, data, conversionApi ) {
		 const model = this.editor.model;
		 const { writer, mapper } = conversionApi;

		 if ( !conversionApi.consumable.consume( data.item, 'insert' ) ) {
			 return;
		 }

		 const targetViewPosition = mapper.toViewPosition( model.createPositionBefore( data.item ) );
		 // For downcast we're using only language-mermaid class. We don't set class to `mermaid language-mermaid` as
		 // multiple markdown converters that we have seen are using only `language-mermaid` class and not `mermaid` alone.
		 const code = writer.createContainerElement( 'code', {
			 class: 'language-mermaid'
		 }, writer.createText( data.item.getAttribute( 'source' ) ) );
		 const pre = writer.createContainerElement( 'pre', {
			 spellcheck: 'false'
		 }, code );

		 writer.insert( targetViewPosition, pre );
		 mapper.bindElements( data.item, code );
	 }

	 /**
	  *
	  * @private
	  * @param {*} evt
	  * @param {*} data
	  * @param {*} conversionApi
	  */
	 _mermaidDowncast( evt, data, conversionApi ) {
		 const { writer, mapper, consumable } = conversionApi;
		 const { editor } = this;
		 const { model, t } = editor;
		 const that = this;

		 if ( !consumable.consume( data.item, 'insert' ) ) {
			 return;
		 }

		 const targetViewPosition = mapper.toViewPosition( model.createPositionBefore( data.item ) );

		 const wrapperAttributes = {
			 class: [ 'ck-mermaid__wrapper' ]
		 };
		 const textareaAttributes = {
			 class: [ 'ck-mermaid__editing-view' ],
			 placeholder: t( 'Insert mermaid source code' ),
			 'data-cke-ignore-events': true
		 };

		 const wrapper = writer.createContainerElement( 'div', wrapperAttributes );
		 const editingContainer = writer.createUIElement( 'textarea', textareaAttributes, createEditingTextarea );
		 const previewContainer = writer.createUIElement( 'div', { class: [ 'ck-mermaid__preview' ] }, createMermaidPreview );

		 writer.insert( writer.createPositionAt( wrapper, 'start' ), previewContainer );
		 writer.insert( writer.createPositionAt( wrapper, 'start' ), editingContainer );

		 writer.insert( targetViewPosition, wrapper );

		 mapper.bindElements( data.item, wrapper );

		 return toWidget( wrapper, writer, {
			 widgetLabel: t( 'Mermaid widget' ),
			 hasSelectionHandle: true
		 } );

		 function createEditingTextarea( domDocument ) {
			 const domElement = this.toDomElement( domDocument );

			 domElement.value = data.item.getAttribute( 'source' );

			 const debouncedListener = debounce( event => {
				 editor.model.change( writer => {
					 writer.setAttribute( 'source', event.target.value, data.item );
				 } );
			 }, DEBOUNCE_TIME );

			 domElement.addEventListener( 'input', debouncedListener );

			 return domElement;
		 }

		 function createMermaidPreview( domDocument ) {
			 // Taking the text from the wrapper container element for now
			 const mermaidSource = data.item.getAttribute( 'source' );
			 const domElement = this.toDomElement( domDocument );

			 domElement.innerHTML = mermaidSource;

			 window.setTimeout( () => {
				 // @todo: by the looks of it the domElement needs to be hooked to tree in order to allow for rendering.
				 that._renderMermaid( domElement );
			 }, 100 );

			 return domElement;
		 }
	 }

	 /**
	  *
	  * @param {*} evt
	  * @param {*} data
	  * @param {*} conversionApi
	  * @returns
	  */
	 _sourceAttributeDowncast( evt, data, conversionApi ) {
		 // @todo: test whether the attribute was consumed.
		 const newSource = data.attributeNewValue;
		 const domConverter = this.editor.editing.view.domConverter;

		 if ( newSource ) {
			 const mermaidView = conversionApi.mapper.toViewElement( data.item );

			 for ( const child of mermaidView.getChildren() ) {
				 if ( child.name === 'textarea' && child.hasClass( 'ck-mermaid__editing-view' ) ) {
					 const domEditingTextarea = domConverter.viewToDom( child, window.document );

					 if ( domEditingTextarea.value != newSource ) {
						 domEditingTextarea.value = newSource;
					 }
				 } else if ( child.name === 'div' && child.hasClass( 'ck-mermaid__preview' ) ) {
					 // @todo: we could optimize this and not refresh mermaid if widget is in source mode.
					 const domPreviewWrapper = domConverter.viewToDom( child, window.document );
					 // console.log( child, domPreviewWrapper );

					 if ( domPreviewWrapper ) {
						 domPreviewWrapper.innerHTML = newSource;
						 domPreviewWrapper.removeAttribute( 'data-processed' );

						 this._renderMermaid( domPreviewWrapper );
					 }
				 }
			 }
		 }
	 }

	 /**
	  *
	  * @private
	  * @param {*} evt
	  * @param {*} data
	  * @param {*} conversionApi
	  */
	 _mermaidUpcast( evt, data, conversionApi ) {
		 const viewCodeElement = data.viewItem;
		 const hasPreElementParent = !viewCodeElement.parent || !viewCodeElement.parent.is( 'element', 'pre' );
		 const hasCodeAncestors = data.modelCursor.findAncestor( 'code' );
		 const { consumable, writer } = conversionApi;

		 if ( !viewCodeElement.hasClass( 'language-mermaid' ) || hasPreElementParent || hasCodeAncestors ) {
			 return;
		 }

		 if ( !consumable.test( viewCodeElement, { name: true } ) ) {
			 return;
		 }
		 const mermaidSource = Array.from( viewCodeElement.getChildren() )
			 .filter( item => item.is( '$text' ) )
			 .map( item => item.data )
			 .join( '' );

		 const mermaidElement = writer.createElement( 'mermaid', {
			 source: mermaidSource,
			 displayMode: 'split'
		 } );

		 // Let's try to insert mermaid element.
		 if ( !conversionApi.safeInsert( mermaidElement, data.modelCursor ) ) {
			 return;
		 }

		 consumable.consume( viewCodeElement, { name: true } );

		 conversionApi.updateConversionResult( mermaidElement, data );
	 }

	 /**
	  * Renders Mermaid in a given `domElement`. Expect this domElement to have mermaid
	  * source set as text content.
	  *
	  * @param {HTMLElement} domElement
	  */
	 _renderMermaid( domElement ) {
		 mermaid.init( undefined, domElement );
	 }
 }


  const MOCK_MERMAID_MARKUP = `flowchart TB
  A --> B
  B --> C`;

  /**
   * The insert mermaid command.
   *
   * Allows to insert mermaid.
   *
   * @extends module:core/command~Command
   */
  class InsertMermaidCommand extends Command {
	  /**
	   * @inheritDoc
	   */
	  refresh() {
		  const documentSelection = this.editor.model.document.selection;
		  const selectedElement = documentSelection.getSelectedElement();

		  if ( selectedElement && selectedElement.name === 'mermaid' ) {
			  this.isEnabled = false;
		  } else {
			  this.isEnabled = true;
		  }
	  }

	  /**
	   * @inheritDoc
	   */
	  execute() {
		  const editor = this.editor;
		  const model = editor.model;

		  model.change( writer => {
			  const item = writer.createElement( 'mermaid', {
				  displayMode: 'split',
				  source: MOCK_MERMAID_MARKUP
			  } );

			  model.insertContent( item );
		  } );

		  editor.editing.view.focus();
	  }
  }

 /**
  * The mermaid preview command.
  *
  * Allows to switch to a preview mode.
  *
  * @extends module:core/command~Command
  */
 class MermaidPreviewCommand extends Command {
	 /**
	  * @inheritDoc
	  */
	 refresh() {
		 const editor = this.editor;
		 const documentSelection = editor.model.document.selection;
		 const selectedElement = documentSelection.getSelectedElement();
		 const isSelectedElementMermaid = selectedElement && selectedElement.name === 'mermaid';

		 if ( isSelectedElementMermaid || documentSelection.getLastPosition().findAncestor( 'mermaid' ) ) {
			 this.isEnabled = !!selectedElement;
		 } else {
			 this.isEnabled = false;
		 }

		 this.value = checkIsOn( editor, 'preview' );
	 }

	 /**
	  * @inheritDoc
	  */
	 execute() {
		 const editor = this.editor;
		 const model = editor.model;
		 const documentSelection = this.editor.model.document.selection;
		 const mermaidItem = documentSelection.getSelectedElement() || documentSelection.getLastPosition().parent;

		 model.change( writer => {
			 if ( mermaidItem.getAttribute( 'displayMode' ) !== 'preview' ) {
				 writer.setAttribute( 'displayMode', 'preview', mermaidItem );
			 }
		 } );
	 }
 }

  /**
   * The mermaid split view command.
   *
   * Allows to switch to a split view mode.
   *
   * @extends module:core/command~Command
   */
  class MermaidSplitViewCommand extends Command {
	  /**
	   * @inheritDoc
	   */
	  refresh() {
		  const editor = this.editor;
		  const documentSelection = editor.model.document.selection;
		  const selectedElement = documentSelection.getSelectedElement();
		  const isSelectedElementMermaid = selectedElement && selectedElement.name === 'mermaid';

		  if ( isSelectedElementMermaid || documentSelection.getLastPosition().findAncestor( 'mermaid' ) ) {
			  this.isEnabled = !!selectedElement;
		  } else {
			  this.isEnabled = false;
		  }

		  this.value = checkIsOn( editor, 'split' );
	  }

	  /**
	   * @inheritDoc
	   */
	  execute() {
		  const editor = this.editor;
		  const model = editor.model;
		  const documentSelection = this.editor.model.document.selection;
		  const mermaidItem = documentSelection.getSelectedElement() || documentSelection.getLastPosition().parent;

		  model.change( writer => {
			  if ( mermaidItem.getAttribute( 'displayMode' ) !== 'split' ) {
				  writer.setAttribute( 'displayMode', 'split', mermaidItem );
			  }
		  } );
	  }
  }


/**
 * The mermaid source view command.
 *
 * Allows to switch to a source view mode.
 *
 * @extends module:core/command~Command
 */
class MermaidSourceViewCommand extends Command {
	/**
	 * @inheritDoc
	 */
	refresh() {
		const editor = this.editor;
		const documentSelection = editor.model.document.selection;
		const selectedElement = documentSelection.getSelectedElement();
		const isSelectedElementMermaid = selectedElement && selectedElement.name === 'mermaid';

		if ( isSelectedElementMermaid || documentSelection.getLastPosition().findAncestor( 'mermaid' ) ) {
			this.isEnabled = !!selectedElement;
		} else {
			this.isEnabled = false;
		}

		this.value = checkIsOn( editor, 'source' );
	}

	/**
	 * @inheritDoc
	 */
	execute() {
		const editor = this.editor;
		const model = editor.model;
		const documentSelection = this.editor.model.document.selection;
		const mermaidItem = documentSelection.getSelectedElement() || documentSelection.getLastPosition().parent;

		model.change( writer => {
			if ( mermaidItem.getAttribute( 'displayMode' ) !== 'source' ) {
				writer.setAttribute( 'displayMode', 'source', mermaidItem );
			}
		} );
	}
}
