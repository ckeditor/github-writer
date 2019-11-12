/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// import delegate from 'delegate-it';

export default class Feature {
	constructor( name, editor ) {
		this.name = name;
		this.editor = editor;
	}

	attach() {
		// Get the original DOM button.
		const italic = this.editor.dom.toolbar.querySelector( 'md-' + this.name );

		const rteItalic = copyElement( italic, 'rte-button' );
		rteItalic.classList.add( 'github-rte-button-rte', 'github-rte-button-' + this.name );
		rteItalic.classList.remove( 'github-rte-button-markdown' );
		rteItalic.setAttribute( 'role', 'button' );
		rteItalic.setAttribute( 'data-ga-click', 'GitHub RTE, click, ' + name );

		// Inject the new button right next to the original one.
		italic.insertAdjacentElement( 'afterend', rteItalic );
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



// import delegate from 'delegate-it';
//
/* Creating custom buttons */
//
//
// delegate( 'rte-button.rte-button-italic', 'click', event => {
// 	console.log( 'Event delegation!' );
// 	App.run();
// } );
