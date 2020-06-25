/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
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

let isProduction = false;

module.exports = ( env, argv ) => {
	isProduction = ( argv.mode === 'production' );

	return {
		entry: './src/github-writer.js',

		output: {
			path: path.resolve( __dirname, '../build' ),
			filename: 'github-writer.js'
		},

		module: {
			rules: [
				{
					test: [
						/\/src\/app\/data\/languages.js$/,
						/\/src\/app\/data\/emojis.js$/
					],
					loader: path.resolve( __dirname, '../dev/static-module-loader.js' )
				},
				{
					test: [
						/\.svg$/
					],

					use: [ 'raw-loader' ]
				},
				{
					test: [
						/ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css$/
					],

					use: [ 'null-loader' ]
				},
				{
					test: [
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
			// Disable code splitting for dynamic imports.
			new webpack.optimize.LimitChunkCountPlugin( {
				maxChunks: 1
			} ),

			// Use GH svg icons to match their UI.
			getIconReplacement( 'heading1' ),
			getIconReplacement( 'heading2' ),
			getIconReplacement( 'heading3' ),
			getIconReplacement( 'heading4' ),
			getIconReplacement( 'heading5' ),
			getIconReplacement( 'heading6' ),
			getIconReplacement( 'bold' ),
			getIconReplacement( 'italic' ),
			getIconReplacement( 'quote', 'blockquote' ),
			getIconReplacement( 'code' ),
			getIconReplacement( 'link' ),
			getIconReplacement( 'bulletedlist' ),
			getIconReplacement( 'numberedlist' ),
			getIconReplacement( 'todolist' ),
			getIconReplacement( 'horizontalline' ),
			getIconReplacement( 'strikethrough' ),
			getIconReplacement( 'remove-format', 'removeformat' ),
			getIconReplacement( 'image' ),
			getIconReplacement( 'table' ),

			new CopyPlugin( {
				patterns: [
					{
						from: 'src/extension/manifest.json',
						to: 'github-writer-chrome',
						force: true,
						transform: content => transformManifest( content, 'chrome' )
					},
					{
						from: 'src/extension/manifest.json',
						to: 'github-writer-firefox',
						force: true,
						transform: content => transformManifest( content, 'firefox' )
					}
				]
			} ),

			new FileManagerPlugin( {
				onStart: [
					{
						delete: [ 'build' ]
					},
					{
						copy: [
							{ source: 'src/extension', destination: 'build/github-writer-chrome' },
							{ source: 'src/github-writer.css', destination: 'build/github-writer-chrome' },

							{ source: 'src/extension', destination: 'build/github-writer-firefox' },
							{ source: 'src/github-writer.css', destination: 'build/github-writer-firefox' }
						]
					}
				],
				onEnd: [
					{
						copy: [
							{ source: 'build/github-writer.js*', destination: 'build/github-writer-chrome' },
							{ source: 'build/github-writer.js*', destination: 'build/github-writer-firefox' }
						]
					},
					{
						delete: [
							'build/github-writer.js*'
						]
					},
					( isProduction ) ?
						{
							archive: [
								{ source: 'build/github-writer-chrome', destination: 'build/github-writer-chrome.zip' },
								{
									source: 'build/github-writer-firefox',
									destination: 'build/github-writer-firefox.xpi'
								}
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
		content.name = packageJson.productName;
		content.version = packageJson.version;
		content.description = packageJson.description;
		content.author = packageJson.author;

		if ( !isProduction ) {
			content.name += ' / dev';
		}

		if ( target === 'chrome' ) {
			delete content.browser_specific_settings;
		} else {
			// Firefox doesn't have support for the CodeEditor for now.
			content.content_scripts[ 0 ].matches = content.content_scripts[ 0 ].matches.filter( entry => {
				return ![
					'https://github.com/*/new/*',
					'https://github.com/*/edit/*'
				].includes( entry );
			} );
		}
	}

	return JSON.stringify( content, null, '\t' );
}
