/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global __dirname */

'use strict';

const webpack = require( 'webpack' );
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
					test: [
						/ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
						/[/\\]+src[/\\]+app[/\\]+icons[/\\]+.+\.svg$/,
						/[/\\]+src[/\\]+ckeditor[/\\]+theme[/\\]+icons[/\\]+.+\.svg$/
					],

					use: [ 'raw-loader' ]
				},
				{
					test: [
						/ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css$/,
						/[/\\]src[/\\]app[/\\]theme[/\\].+\.css$/
					],

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

		plugins: [
			// Use GH svg icons to match their UI.
			getIconReplacement( 'bold' ),
			getIconReplacement( 'italic' ),
			getIconReplacement( 'quote', 'blockquote' ),
			getIconReplacement( 'code' ),
			getIconReplacement( 'link' ),
			getIconReplacement( 'bulletedlist' ),
			getIconReplacement( 'numberedlist' ),
			getIconReplacement( 'todolist' )
		],

		// Useful for debugging.
		devtool: 'source-map',

		// By default webpack logs warnings if the bundle is bigger than 200kb.
		performance: { hints: false }
	}
];

function getIconReplacement( name, replacement ) {
	return new webpack.NormalModuleReplacementPlugin(
		new RegExp( `${ name }\\.svg$` ),
		path.resolve( __dirname, `../src/app/icons/${ replacement || name }.svg` ) );
}
