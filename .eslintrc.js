/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

module.exports = {
	// Follow CKEditor 5 rules.
	extends: 'ckeditor5',

	rules: {
		// We allow blocks to be used to organize the logic of longer functions.
		'no-lone-blocks': 'off',
		'quotes': [ 'error', 'single', { 'allowTemplateLiterals': true } ]
	},

	// Bring in environment variables that touch the project, overall.
	'env': {
		'browser': true,
		'commonjs': true
	}
};
