/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import { copyElement } from './util';

export default class Feature {
	constructor( name, editor, properties ) {
		this.name = name;
		this.editor = editor;
		this.kebab = false;

		if ( properties ) {
			Object.assign( this, properties );
		}
	}

	attach() {
		if ( this.kebab ) {
			this._attachToKebab();
		} else {
			this._attachToGithubToolbar();
		}
	}

	_attachToKebab() {
		const view = new ButtonView();
		view.set( {
			label: this.name,
			icon: this.icon,
			class: 'github-rte-toolbar-button toolbar-item tooltipped tooltipped-n'
		} );

		view.on( 'execute', () => this.execute() );

		view.on( 'render', () => view.element.setAttribute( 'aria-label', this.text || this.name ), { priority: 'low' } );

		// Add a simple button to the array of toolbar items.
		this.editor.kebab.buttons.push( view );
	}

	_attachToGithubToolbar() {
		const gitHubName = this.gitHubName || this.name;

		// Get the original DOM button.
		const mdButton = this.editor.dom.toolbar.querySelector( 'md-' + gitHubName );

		const rteButton = copyElement( mdButton, 'rte-button' );
		rteButton.classList.add( 'github-rte-button-rte', 'github-rte-button-' + this.name );
		rteButton.classList.remove( 'github-rte-button-markdown' );
		rteButton.setAttribute( 'role', 'button' );
		rteButton.setAttribute( 'data-ga-click', 'GitHub RTE, click, ' + name );

		// Inject the new button right next to the original one.
		mdButton.insertAdjacentElement( 'afterend', rteButton );

		// Connects the button click to the editor command.
		rteButton.addEventListener( 'click', () => {
			this.execute();
			this.editor.editor.editing.view.focus();
		} );

		// We don't want the button to still the focus on click.
		rteButton.addEventListener( 'mousedown', evt => evt.preventDefault() );
	}

	execute() {
		this.editor.editor.execute( this.command || this.name );
	}
}

