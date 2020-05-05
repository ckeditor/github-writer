/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// This is the "root suite" hooks, which run before and after all tests.
//
// By requiring this file at the top of test files, it makes it possible to run the files individually
// and still have these hooks executed.

const { quit } = require( './util/util' );

after( 'should close the browser', () => quit() );
