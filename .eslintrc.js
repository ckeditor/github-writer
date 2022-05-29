/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

module.exports = {
	plugins: [ 'no-unsanitized' ],

	// Follow CKEditor 5 rules.
	extends: [ 'ckeditor5', 'plugin:no-unsanitized/DOM' ],

	rules: {
		// We allow blocks to be used to organize the logic of longer functions.
		'no-lone-blocks': 'off',
		'no-inner-declarations': 'off',
		'mocha/no-sibling-hooks': 'off',
		'mocha/no-top-level-hooks': 'off',
		'quotes': [ 'error', 'single', { 'allowTemplateLiterals': true } ]
	},

	// Bring in environment variables that touch the project, overall.
	env: {
		'browser': true,
		'commonjs': true
	},

	overrides: [
		{
			files: [ 'tests/**/*.js' ],
			env: {
				'mocha': true,
				'browser': true,
				'commonjs': true,
				'node': true
			}
		}
	]
};
