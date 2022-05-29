/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// TODO: Publish this as a generic "Static Module Compiler" plugin (?) for webpack.

const Module = require( 'module' );

/**
 * A webpack loader that replaces the logic from module files with the raw result of them.
 * Exports that are Promises are assigned to their resolved value.
 */
module.exports = function( content ) {
	const callback = this.async();

	const exports = exec( content, this );

	const promises = Object.entries( exports ).map( ( [ name, value ] ) => {
		return Promise.resolve( value ).then( resolvedValue => {
			return `module.exports.${ name } = ${ JSON.stringify( resolvedValue ) };`;
		} );
	} );

	Promise.all( promises ).then( lines => {
		callback( null, lines.join( '\n' ) );
	} );
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
