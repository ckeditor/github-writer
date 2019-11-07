'use strict';

const path = require( 'path' );
const { styles } = require( '@ckeditor/ckeditor5-dev-utils' );

module.exports = [
	// The loader script, responsible for injecting the app into the proper GitHub pages.
	{
		entry: './src/loader/loader.js',

		output: {
			path: path.resolve( __dirname, '../build' ),
			filename: 'loader.js'
		}
	}

	/*
	// The main application, which replaces textareas with GitHiub RTE.
	{
		entry: './tmp/app.js',

		output: {
			path: path.resolve( __dirname, '../build' ),
			filename: 'app.js'
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
	*/
]
;
