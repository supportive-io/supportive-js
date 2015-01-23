'use strict';

var FileSystem	= require ( 'fs' ),
	jsProcessor	= require ( 'uglify-js' ),
	js_file		= FileSystem. readFileSync ( './supportive.js' ),
	ast			= jsProcessor. parser. parse ( js_file );

ast		= jsProcessor. uglify. ast_mangle ( ast );
ast		= jsProcessor. uglify. ast_squeeze ( ast );
js_file	= jsProcessor. uglify. gen_code ( ast );

FileSystem. outputFileSync ( './supportive.min.js', js_file );