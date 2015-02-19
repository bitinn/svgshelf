
/**
 * svgshelf.js
 *
 * Take svg files and bundle them
 */

var fs = require('fs');
var path = require('path');

var cheerio = require('cheerio');
var chalk = require('chalk');
var denodeify = require('denodeify');
var glob = require('glob');
var hogan = require('hogan.js');

var readFile = denodeify(fs.readFile);
var writeFile = denodeify(fs.writeFile);
var readDir = denodeify(glob);

module.exports = Shelf;

function Shelf(opts) {
	if (opts._.length < 2) {
		console.log(chalk.yellow('Usage: svgshelf folder/\\*.svg folder/output.svg'));
		return;
	}

	options = {
		prefix: opts.p || ''
		, includedemo: opts.d || 0
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
	var files = yield readDir(options.folder);
	console.log(files);

	var $resultDocument = cheerio.load('<svg><defs></defs></svg>', { xmlMode: true });
	var $resultSvg = $resultDocument('svg');
	var $resultDefs = $resultDocument('defs').first();
	var iconNameViewBoxArray = [];
	$resultSvg.attr('xmlns', 'http://www.w3.org/2000/svg');

	// Yield in order, slower but easier to debug
	for (var i = 0; i < files.length; i++) {
		var filepath = files[i];
		var id = path.basename(filepath, '.svg');

		var contentStr = yield readFile(filepath);
		if (!contentStr) {
			console.log(chalk.red('% does not exist'), filepath);
			continue;
		}
		var $ = cheerio.load(contentStr, {
			normalizeWhitespace: true
			, xmlMode: true
		});

		var $svg = $('svg');
		var $title = $('title');
		var $desc = $('desc');
		var $def = $('defs').first();
		var defContent = $def.length && $def.html();

		if (defContent) {
			$resultDefs.append(defContent);
		}

		var title = $title.first().html();
		var desc = $desc.first().html();

		$def.remove();
		$title.remove();
		$desc.remove();

		title = title || id;

		var $res = cheerio.load('<symbol>' + $svg.html() + '</symbol>', { xmlMode: true });
		var $symbol = $res('symbol').first();

		for (var attr in options.symbol) {
			$symbol.attr(attr, options.symbol[attr]);
		}

		if (desc) {
			$symbol.prepend('<desc>' + desc + '</desc>');
		}

		if (title) {
			$symbol.prepend('<title>' + title + '</title>');
		}

		var viewBox = $svg.attr('viewBox');

		if (!viewBox && options.inheritviewbox) {
			var width = $svg.attr('width');
			var height = $svg.attr('height');
			var pxSize = /^\d+(\.\d+)?(px)?$/;
			if (pxSize.test(width) && pxSize.test(height)) {
				viewBox = '0 0 ' + parseFloat(width) + ' ' + parseFloat(height);
			}
		}

		if (viewBox) {
			$symbol.attr('viewBox', viewBox);
		}

		var graphicId = options.prefix + id;
		$symbol.attr('id', graphicId);

		var addToDefs = function(){
			var $elem = $res(this);
			$resultDefs.append($elem.toString());
			$elem.remove();
		};

		$res('linearGradient').each(addToDefs);
		$res('radialGradient').each(addToDefs);
		$res('pattern').each(addToDefs);

		$resultSvg.append($res.html());

		if ($resultDefs.html().trim() === '') {
			$resultDefs.remove();
		}

		var result = $resultDocument.html();
		var destName = path.basename(options.output, '.svg');

		yield writeFile(options.output, result);
		console.log(chalk.green('% created'), options.output);

		if (options.includedemo) {
			iconNameViewBoxArray.push({
				name: graphicId,
				title: title
			});

			$resultSvg.attr('style', 'width:0;height:0;visibility:hidden;');

			var demoHTML;
			var viewData = {
				svg: $resultDocument.html(),
				icons: iconNameViewBoxArray
			};

			if (typeof options.includedemo === 'function'){
				demoHTML = options.includedemo(viewData);
			} else{
				var template = yield readFile('./lib/demo.mustache');
				template = hogan.compile(template.toString());
				demoHTML = template.render(viewData);
			}

			var demoPath = path.resolve(path.dirname(options.output), destName + '-demo.html');
			yield writeFile(demoPath, demoHTML);
			console.log(chalk.green('% created'), demoPath);
		}
	};
};

function getIdFromName(name) {
	var dotPos = name.indexOf('.');
	if (dotPos > -1){
		name = name.substring(0, dotPos);
	}
	return name;
};
