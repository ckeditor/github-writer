/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global __dirname */

'use strict';

const webpack = require( 'webpack' );
const CopyPlugin = require( 'copy-webpack-plugin' );
const FileManagerPlugin = require( 'filemanager-webpack-plugin' );

const path = require( 'path' );
const { styles } = require( '@ckeditor/ckeditor5-dev-utils' );

const packageJson = require( '../package.json' );

module.exports = ( env, argv ) => {
	return {
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
						/[/\\]+src[/\\]+app[/\\]+icons[/\\]+.+\.svg$/
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
			getIconReplacement( 'todolist' ),

			new CopyPlugin( [
				{
					from: 'src/extension/manifest.json',
					to: 'github-rte-chrome',
					transform: content => transformManifest( content, 'chrome' )
				},
				{
					from: 'src/extension/manifest.json',
					to: 'github-rte-firefox',
					transform: content => transformManifest( content, 'firefox' )
				}
			] ),

			new FileManagerPlugin( {
				onStart: {
					delete: [ 'build' ]
				},
				onEnd: [
					{
						copy: [
							{ source: 'build/github-rte.*', destination: 'build/github-rte-chrome' },
							{ source: 'src/github-rte.css', destination: 'build/github-rte-chrome' },
							{ source: 'src/extension/icons', destination: 'build/github-rte-chrome/icons' },

							{ source: 'build/github-rte.*', destination: 'build/github-rte-firefox' },
							{ source: 'src/github-rte.css', destination: 'build/github-rte-firefox' },
							{ source: 'src/extension/icons', destination: 'build/github-rte-firefox/icons' }
						]
					},
					{
						delete: [
							'build/github-rte.*'
						]
					},
					( argv.mode === 'production' ) ?
						{
							archive: [
								{ source: 'build/github-rte-chrome', destination: 'build/github-rte-chrome.zip' },
								{ source: 'build/github-rte-firefox', destination: 'build/github-rte-firefox.xpi' }
							]
						} : {}
				]
			} )
		],

		// Useful for debugging.
		devtool: 'source-map',

		// By default webpack logs warnings if the bundle is bigger than 200kb.
		performance: { hints: false }
	};
};

function getIconReplacement( name, replacement ) {
	return new webpack.NormalModuleReplacementPlugin(
		new RegExp( `${ name }\\.svg$` ),
		path.resolve( __dirname, `../src/app/icons/${ replacement || name }.svg` ) );
}

function transformManifest( content, target ) {
	// Converts the Buffer to String.
	content = content.toString();

	// Remove JavaScript line comments.
	content = content.replace( /^\s*\/\/.*$/gm, '' );

	content = JSON.parse( content );

	// Setup the contents.
	{
		content.version = packageJson.version;

		if ( target === 'chrome' ) {
			delete content.browser_specific_settings;
		}
	}

	return JSON.stringify( content, null, '\t' );
}
