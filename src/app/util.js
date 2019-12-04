/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// Makes a copy of a DOM element, with a different name.
export function copyElement( sourceElement, newName, deep = true ) {
	const newElement = document.createElement( newName );

	for ( let i = 0; i < sourceElement.attributes.length; i++ ) {
		const att = sourceElement.attributes[ i ];
		newElement.setAttribute( att.name, att.value );
	}

	if ( deep ) {
		sourceElement.childNodes.forEach( child => {
			newElement.appendChild( child.cloneNode( true ) );
		} );
	}

	return newElement;
}

export function createElementFromHtml( html ) {
	const template = document.createElement( 'template' );
	template.innerHTML = html;
	return template.content.firstElementChild;
}

export function checkDom( dom ) {
	Object.getOwnPropertyNames( dom ).forEach( key => {
		const value = dom[ key ];
		if ( !value ) {
			throw new PageIncompatibilityError();
		}

		if ( Object.getPrototypeOf( value ) === Object.prototype ) {
			checkDom( value );
		}
	} );
}

/**
 * We do some initialization checks on the page, to minimize the risk of execution errors while injecting the editor.
 * If GH will ever change the dom and make it incompatible, the PageIncompatibilityError is thrown.
 * This should not affect the ability of the user to use the page as we'll leave things untouched and quit.
 */
export class PageIncompatibilityError extends Error {
	constructor() {
		super( `GitHub RTE error: this page doesn't seem to be compatible with this application anymore. ` +
			`Upgrade to the latest version of the browser extension.` );
	}
}

/**
 * Injects a `<script>` element into the page, executing the provided function.
 *
 * Note that the function will be inlined as a string, so it'll not have access to any local references.
 * @param fn The function to be executed.
 */
export function injectFunctionExecution( fn ) {
	fn = fn.toString();

	// Remove comments from the function as they can break the execution (the function is inlined as a single line).
	fn = fn.replace( /\/\/.*$/mg, '' );

	const script = document.createElement( 'script' );
	script.innerText = '(' + ( fn ) + ')();';

	( document.body || document.head ).appendChild( script );
}

/**
 * Gets the html of the "New Issue" page through an xhr request and returns it as a dom.
 *
 * @returns {Promise<DocumentFragment>} A document fragment with the whole dom of the page.
 */
export function getNewIssuePageDom() {
	return new Promise( ( resolve, reject ) => {
		// Build the url to the new issue page.
		const location = document.location;
		const path = document.location.pathname.match( /^\/.+?\/.+?\// ) + 'issues/new';
		const url = `${ location.protocol }//${ location.host }${ path }`;

		const xhr = new XMLHttpRequest();
		xhr.open( 'GET', url, true );

		xhr.addEventListener( 'error', () => reject( new Error( `Error loading mentions from $(url).` ) ) );
		xhr.addEventListener( 'abort', () => reject() );
		xhr.addEventListener( 'load', () => {
			// Inject the returned html into a template element.
			const template = document.createElement( 'template' );
			template.innerHTML = xhr.response;

			// Resolve the promise with the template dom.
			resolve( template.content );
		} );

		xhr.send();
	} );
}
