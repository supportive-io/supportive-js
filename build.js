'use strict';

var FileSystem	= require ( 'fs' ),
	jsProcessor	= require ( 'uglify-js' ),
	js_file		= FileSystem. readFileSync ( './supportive.js' ). toString(),
	ast			= jsProcessor. parser. parse ( js_file );

ast		= jsProcessor. uglify. ast_mangle ( ast );
ast		= jsProcessor. uglify. ast_squeeze ( ast );
js_file	= jsProcessor. uglify. gen_code ( ast );

FileSystem. writeFileSync ( './supportive.min.js', js_file );

console. log ( 'Minification Complete.' )