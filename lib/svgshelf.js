
/**
 * svgshelf.js
 *
 * Take svg files and bundle them into a single file
 */

var fs = require('fs');
var path = require('path');

var cheerio = require('cheerio');
var chalk = require('chalk');
var denodeify = require('denodeify');
var glob = require('glob');
var hogan = require('hogan.js');
var beautify = require('js-beautify').html;

var readFile = denodeify(fs.readFile);
var writeFile = denodeify(fs.writeFile);
var readDir = denodeify(glob);

module.exports = Shelf;

function Shelf(opts) {
	if (opts._.length < 2) {
		console.log(chalk.yellow('Usage: svgshelf folder/\\*.svg folder/output.svg'));
		return;
	}

	// defaults
	options = {
		prefix: opts.p || ''
		, demo: opts.d || false
		, beautify: opts.b || false
		, folder: opts._[0]
		, output: opts._[1]
	};

	this.options = options;
}

Shelf.prototype.run = function *() {
	if (!this.options) {
		return;
	}
	var options = this.options;

	// expand glob expression into an array of filepath
	var files = yield readDir(options.folder);

	// create base svg file
	var $doc = cheerio.load('<svg></svg>', { xmlMode: true });
	var $svg = $doc('svg');
	$svg.attr('xmlns', 'http://www.w3.org/2000/svg');

	// keep a list of icon names for demo output
	var names = [];

	// yield in order, slower but easier to debug
	for (var i = 0; i < files.length; i++) {
		var filepath = files[i];

		// load svg
		var content = yield readFile(filepath);
		if (!content) {
			console.log(chalk.red('% does not exist'), filepath);
			continue;
		}
		var $ = cheerio.load(content, {
			normalizeWhitespace: true
			, xmlMode: true
		});

		// generate unique id for it
		var id = path.basename(filepath, '.svg');
		if (names.indexOf(id) !== -1) {
			console.log(chalk.red('% duplicate filename found'), filepath);
			continue;
		}
		names.push(id);

		// copy viewbox value
		var svg = $('svg');
		var viewbox = svg.attr('viewBox');

		// generate symbol and append to existing svg
		var $ = cheerio.load('<symbol>' + svg.html() + '</symbol>', { xmlMode: true });
		var symbol = $('symbol').first();
		symbol.attr('id', options.prefix + id);
		symbol.attr('viewBox', viewbox);

		$svg.append($.html());
	};

	// output to file
	var svg = $doc.html();
	if (options.beautify) {
		svg = beautify(svg, {
			preserve_newlines: false
		});
	}
	yield writeFile(options.output, svg);
	console.log(chalk.green('% bundle created'), options.output);

	if (!options.demo) {
		return;
	}

	// prepare demo data
	var name = path.basename(options.output, '.svg');
	var data = {
		svg: svg
		, icons: names.map(function(name) {
			return options.prefix + name;
		})
	};

	// render demo template
	var template = yield readFile('./lib/demo.mustache');
	var compiled = hogan.compile(template.toString());
	var html = compiled.render(data);

	var demo = path.join(path.dirname(options.output), name + '-demo.html');
	yield writeFile(demo, html);
	console.log(chalk.green('% demo created'), demo);
};
