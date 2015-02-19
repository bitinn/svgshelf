#!/usr/bin/env node

/**
 * index.js
 *
 * A simple CLI for shelving multiple svg into a single file
 */

var opts = require('minimist')(process.argv.slice(2));
var Shelf = require('./lib/svgshelf');

// command line mode
if (!module.parent) {
	factory(opts);
}

function factory(opts) {
	var w = new Shelf(opts);
	w.run();
};
