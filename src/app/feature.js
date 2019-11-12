/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export default class Feature {
	constructor( name, editor ) {
		this.name = name;
		this.editor = editor;
	}

	attach() {
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
		this.editor.editor.execute( this.name );
	}
}

// Makes a copy of a DOM element, with a different name.
function copyElement( sourceElement, newName ) {
	const newElement = document.createElement( newName );

	for ( let i = 0; i < sourceElement.attributes.length; i++ ) {
		const att = sourceElement.attributes[ i ];
		newElement.setAttribute( att.name, att.value );
	}

	sourceElement.childNodes.forEach( child => {
		newElement.appendChild( child.cloneNode( true ) );
	} );

	return newElement;
}
