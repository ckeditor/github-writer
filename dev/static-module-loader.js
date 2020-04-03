/*
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// TODO: Publish this as a generic "Static Module Compiler" plugin (?) for webpack.

const Module = require( 'module' );

/**
 * A webpack loader that replaces the logic module files with the raw result of them.
 *
 * @returns {string}
 */
module.exports = function( content ) {
	const exports = exec( content, this );
	const lines = Object.entries( exports ).map( ( [ name, value ] ) => {
		return `module.exports.${ name } = ${ JSON.stringify( value ) };`;
	} );

	return lines.join( '\n' );
};

const parentModule = module;

// Borrowed from val-loader:
// https://github.com/webpack-contrib/val-loader/blob/656f260886b0abe78ee0392e52486644ee388b4d/src/index.js#L10-L23
function exec( code, loaderContext ) {
	const { resource, context } = loaderContext;

	const module = new Module( resource, parentModule );

	// eslint-disable-next-line no-underscore-dangle
	module.paths = Module._nodeModulePaths( context );
	module.filename = resource;

	// eslint-disable-next-line no-underscore-dangle
	module._compile( code, resource );

	return module.exports;
}
