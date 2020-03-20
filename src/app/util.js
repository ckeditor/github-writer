/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * For testing purposes, we inject this function in the document, so we're able to stub it (document.location cannot
 * be changed).
 *
 * @return {Location} A document location object.
 * @private
 */
window.__getLocation = () => {
	return window.location;
};

/**
 * Creates an element out of its outer html string.
 *
 * @param {String} html The outer html of the element.
 * @returns {HTMLElement} The element created.
 */
export function createElementFromHtml( html ) {
	const div = document.createElement( 'div' );

	// Safe because we don't use this function for loaded HTML.
	// eslint-disable-next-line no-unsanitized/property
	div.innerHTML = html;

	return div.firstElementChild;
}

/**
 * Runs a deep pass on an object to check if all its defined properties have values (mostly dom elements).
 * If not, throws a {PageIncompatibilityError}.
 *
 * @param {Object} dom The object to be checked.
 */
export function checkDom( dom ) {
	Object.getOwnPropertyNames( dom ).forEach( key => {
		const value = dom[ key ];
		if ( !value ) {
			throw new PageIncompatibilityError( key );
		}

		if ( Object.getPrototypeOf( value ) === Object.prototype ) {
			checkDom( value );
		}
	} );
}

/**
 * Thrown when the GitHub pages are now any more compatible with the app.
 *
 * We do some initialization checks on the page, to minimize the risk of execution errors while injecting the editor.
 * If GH will ever change the dom and make it incompatible, the PageIncompatibilityError is thrown.
 * This should not affect the ability of the user to use the page as we'll leave things untouched and quit.
 */
export class PageIncompatibilityError extends Error {
	/**
	 * Creates a instance of the PageIncompatibilityError class.
	 *
	 * @param elementKey {String} The object key (usually meant to point to an element), which caused the error.
	 */
	constructor( elementKey ) {
		super( `GitHub RTE error: ("${ elementKey }") not found. This page doesn't seem to be compatible with this application anymore. ` +
			`Upgrade to the latest version of the browser extension.` );
	}
}

/**
 * Injects a `<script>` element into the page, executing the provided function.
 *
 * Note that the function will be inlined as a string, so it'll not have access to any local references.
 *
 * @param {Function} fn The function to be executed.
 */
export function injectFunctionExecution( fn ) {
	// We give the convenience of passing a function here, but we have to make it a string
	// to inject it into the script element.
	let fnBody = fn.toString();

	// Remove comments they can break the execution (the browser may inline it as as a single line).
	fnBody = fnBody.replace( /\/\/.*$/mg, '' );

	const id = 'GitHub-RTE-' + Date.now();
	const script = document.createElement( 'script' );
	script.id = id;
	script.innerText =
		'(' + ( fnBody ) + ')();' +
		'document.getElementById("' + id + '").remove();';

	( document.body || /* istanbul ignore next */ document.head ).appendChild( script );
}

/**
 * Creates and opens a XMLHttpRequest matching the requirements of GitHub and browsers.
 *
 * @param url {String} The request url.
 * @param [method] {String} The request method. Defaults to 'POST'.
 * @return {XMLHttpRequest} The created XMLHttpRequest instance.
 */
export function openXmlHttpRequest( url, method = 'POST' ) {
	const location = window.__getLocation();

	// Firefox needs the whole url, so we fix it here, if necessary.
	if ( url.startsWith( '/' ) ) {
		url = `${ location.protocol }//${ location.host }${ url }`;
	}

	const xhr = new XMLHttpRequest();
	xhr.open( method, url, true );

	// Some of the requests don't work without this one.
	xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );

	return xhr;
}

/**
 * Gets the html of the "New Issue" page through an xhr request and returns it as a dom.
 *
 * @returns {Promise<DocumentFragment>} A document fragment with the whole dom of the page.
 */
export function getNewIssuePageDom() {
	return new Promise( ( resolve, reject ) => {
		const location = window.__getLocation();

		// Build the url for the new issue page => /organization/repo/issues/new
		const url = location.pathname.match( /^\/.+?\/.+?\// ) + 'issues/new';

		const xhr = openXmlHttpRequest( url, 'GET' );

		xhr.addEventListener( 'error', () => reject( new Error( `Error loading $(url).` ) ) );
		xhr.addEventListener( 'abort', () => reject() );
		xhr.addEventListener( 'load', () => {
			// Inject the returned html into a template element.
			const template = document.createElement( 'template' );

			// Safe because we don't actually insert this HTML in the page. We load it in the template and process it safely.
			// eslint-disable-next-line no-unsanitized/property
			template.innerHTML = xhr.response;

			// Resolve the promise with the template dom.
			resolve( template.content );
		} );

		xhr.send();
	} );
}

/**
 * Concatenates the initials of words and names present in a string.
 *
 * @param {String} text The text to be parsed.
 * @returns {String} A string with the concatenated initials. An empty string if nothing found.
 */
export function getInitials( text ) {
	if ( text && text.match ) {
		const initials = text.match( /\b\w/g );
		if ( initials ) {
			return initials.join( '' );
		}
	}

	return '';
}

/**
 * Escapes regular expression special characters in a string.
 *
 * @param string {String}
 * @returns {String} The escaped string.
 */
export function escapeRegex( string ) {
	return string.replace( /[\\^$.*+?()[\]{}|]/g, '\\$&' );
}

/**
 * Acts as a container for dom manipulations, make it possible to easily revert them.
 */
export class DomManipulator {
	/**
	 * Creates an instance of the DomManipulator class.
	 */
	constructor() {
		this._rollbackOperations = [];
	}

	/**
	 * Adds an attribute to an element with a desired value. It overwrites if it already exists.
	 *
	 * The rollback operation for this action will always remove the attribute, even if it existed earlier.
	 *
	 * @param target {HTMLElement} The target element.
	 * @param name {String} The attribute name.
	 * @param value {*} The value to be set. It is converted to a string.
	 */
	addAttribute( target, name, value ) {
		target.setAttribute( name, value );

		this.addRollbackOperation( () => target.removeAttribute( name ) );
	}

	/**
	 * Adds a class to an element.
	 *
	 * The rollback operation will always remove the class, even if it existed already.
	 *
	 * @param target {HTMLElement} The target element.
	 * @param name {String} The class name.
	 */
	addClass( target, name ) {
		target.classList.add( name );

		this.addRollbackOperation( () => target.classList.remove( name ) );
	}

	/**
	 * Toggles a class in an element.
	 *
	 * The rollback operation will always remove the class, even if it existed already.
	 *
	 * @param target {HTMLElement} The target element.
	 * @param name {String} The class name.
	 * @param force {Boolean} `true` to force add the class. `false` to force remove it.
	 */
	toggleClass( target, name, force ) {
		target.classList.toggle( name, force );

		this.addRollbackOperation( () => target.classList.remove( name ) );
	}

	/**
	 * Appends a node into another node (usually an HTMLElement).
	 *
	 * @param target {ParentNode} The target element.
	 * @param node {Node|String} The node to be added.
	 */
	append( target, node ) {
		target.append( node );

		this.addRollbackOperation( () => node.remove() );
	}

	/**
	 * Appends a node after another one.
	 *
	 * @param existingNode {ChildNode} The existing node.
	 * @param node {Node|String} The node to be appended.
	 */
	appendAfter( existingNode, node ) {
		existingNode.after( node );

		this.addRollbackOperation( () => node.remove() );
	}

	/**
	 * Setup an event listener to the given target.
	 *
	 * @param target {EventTarget} The target.
	 * @param event {String} The event name.
	 * @param callback {Function} The listener to be executed when the event fires.
	 * @param [options] {Object} An options object specifies characteristics about the event listener.
	 *        See the dom documentation for EventTarget.addEventListener for options.
	 */
	addEventListener( target, event, callback, options ) {
		target.addEventListener( event, callback, options );

		this.addRollbackOperation( () => target.removeEventListener( event, callback, options ) );
	}

	/**
	 * Adds an operation to be executed during rollback.
	 *
	 * These operations will be removed after rollback and will not be executed again.
	 *
	 * @param operation {Function} The operation.
	 */
	addRollbackOperation( operation ) {
		this._rollbackOperations.push( operation );
	}

	/**
	 * Reverts all manipulations made through the class instance since its creation or the last call of this method.
	 */
	rollback() {
		this._rollbackOperations.forEach( operation => operation() );
		this._rollbackOperations = [];
	}
}
