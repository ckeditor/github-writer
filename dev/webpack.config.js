/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global __dirname */

'use strict';

const path = require( 'path' );
const { styles } = require( '@ckeditor/ckeditor5-dev-utils' );

module.exports = [
	{
		entry: './src/github-rte.js',

		output: {
			path: path.resolve( __dirname, '../build' ),
			filename: 'github-rte.js'
		},

		module: {
			rules: [
				{
					test: /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,

					use: [ 'raw-loader' ]
				},
				{
					test: /ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css$/,

					use: [
						{
							loader: 'style-loader',
							options: {
								injectType: 'singletonStyleTag'
							}
						},
						{
							loader: 'postcss-loader',
							options: styles.getPostCssConfig( {
								themeImporter: {
									themePath: require.resolve( '@ckeditor/ckeditor5-theme-lark' )
								},
								minify: true
							} )
						}
					]
				}
			]
		},

		// Useful for debugging.
		devtool: 'source-map',

		// By default webpack logs warnings if the bundle is bigger than 200kb.
		performance: { hints: false }
	}
];
