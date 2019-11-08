/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import App from './app/app';

const startTime = new Date();

App.run();

// TODO: Remove this at some point.
console.log( 'GitHub RTE loaded and ready. Running time: ' + ( new Date() - startTime ) + 'ms.' );

// import delegate from 'delegate-it';
//
/* Creating custom buttons */
//
// const italic = document.querySelector( 'md-italic' );
// const rteItalic = copyElement( italic, 'rte-button' );
// rteItalic.classList.add( 'rte-button-italic' );
// rteItalic.setAttribute( 'role', 'button' );
// rteItalic.setAttribute( 'data-ga-click', 'GitHub RTE, click, italic' );
//
// italic.insertAdjacentElement( 'afterend', rteItalic );
//
// function copyElement( sourceElement, newName ) {
// 	const newElement = document.createElement( newName );
//
// 	for ( let i = 0; i < sourceElement.attributes.length; i++ ) {
// 		const att = sourceElement.attributes[ i ];
// 		newElement.setAttribute( att.name, att.value );
// 	}
//
// 	sourceElement.childNodes.forEach( child => {
// 		newElement.appendChild( child.cloneNode( true ) );
// 	} );
//
// 	return newElement;
// }
//
// delegate( 'rte-button.rte-button-italic', 'click', event => {
// 	console.log( 'Event delegation!' );
// 	App.run();
// } );

