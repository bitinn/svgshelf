
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
	options = {
		prefix: opts.prefix || ''
		, svg: opts.svg || {
			'xmlns': 'http://www.w3.org/2000/svg'
		}
		, symbol: opts.symbol || {}
		, formatting: opts.formatting || false
		, includedemo: opts.includedemo || false
		, inheritviewbox: opts.inheritviewbox || false
		, cleanupdefs: opts.cleanupdefs || false
		, fixedSizeVersion: opts.fixedSizeVersion || false
		, externalDefs: opts.externalDefs || false
		, includeTitleElement: opts.includeTitleElement || true
		, preserveDescElement: opts.preserveDescElement || true
		, folder: opts.f
		, output: opts.o
	};

	if (!options.folder || !options.output) {
		console.log(chalk.yellow('Usage: svgshelf -f folder/ -o output.svg'));
		return;
	}

	this.options = options;
}

Shelf.prototype.run = function *() {
	if (!this.options) {
		return;
	}

	var options = this.options;

	// Matching an url() reference. To correct references broken by making ids unique to the source svg
	var urlPattern = /url\(\s*#([^ ]+?)\s*\)/g;

	var files = yield readDir(options.folder);
	console.log(files);

	// Yield in order, slower but easier to debug
	for (var i = 0; i < files.length; i++) {
		var filepath = files[i];

		var $resultDocument = cheerio.load('<svg><defs></defs></svg>', { xmlMode: true });
		var $resultSvg = $resultDocument('svg');
		var $resultDefs = $resultDocument('defs').first();
		var iconNameViewBoxArray = [];

		// Merge in SVG attributes from option
		for (var attr in options.svg) {
			$resultSvg.attr(attr, options.svg[attr]);
		}

		var filename = path.basename(filepath, '.svg');
		var id = this._get_id(filename);
		var contentStr = yield readFile(filepath);

		if (!contentStr) {
			console.log(chalk.red('% does not exist'), filepath);
			continue;
		}

		var $ = cheerio.load(contentStr, {
			normalizeWhitespace: true
			, xmlMode: true
		});

		// Remove empty g elements
		$('g').each(function(){
			var $elem = $(this);
			if (!$elem.children().length) {
				$elem.remove();
			}
		});

		// Map to store references from id to uniqueId + id;
		var mappedIds = {};

		$('[id]').each(function () {
			var $elem = $(this);
			var id = $elem.attr('id');
			var uid = this._get_uid(id);
			mappedIds[id] = {
				id : uid,
				referenced : false,
				$elem : $elem
			};
			$elem.attr('id', uid);
		});

		$('*').each(function () {
			var $elem = $(this);
			var attrs = $elem.attr();

			Object.keys(attrs).forEach(function (key) {
				var value = attrs[key];
				var id, match, preservedKey = '';

				while((match = urlPattern.exec(value)) !== null) {
					id = match[1];
					if (!!mappedIds[id]) {
						mappedIds[id].referenced = true;
						$elem.attr(key, value.replace(match[0], 'url(#' + mappedIds[id].id + ')'));
					}
				}

				if (key === 'xlink:href') {
					id = value.substring(1);
					var idObj = mappedIds[id];
					if (!!idObj){
						idObj.referenced = false;
						$elem.attr(key, '#' + idObj.id);
					}
				}

				// IDs are handled separately
				if (key !== 'id') {

					if (options.cleanupdefs || !$elem.parents('defs').length) {
						if (key.match(/preserve--/)) {
							//Strip off the preserve--
							preservedKey = key.substring(10);
						}

						if (preservedKey && preservedKey.length) {
							//Add the new key preserving value
							$elem.attr(preservedKey, $elem.attr(key));
							//Remove the old preserve--foo key
							$elem.removeAttr(key);
						}
					}
				}
			});
		});

		var $svg = $('svg');
		var $title = $('title');
		var $desc = $('desc');
		var $def = $('defs').first();
		var defContent = $def.length && $def.html();

		// Merge in the defs from this svg in the result defs block
		if (defContent) {
			$resultDefs.append(defContent);
		}

		var title = $title.first().html();
		var desc = $desc.first().html();

		// Remove def, title, desc from this svg
		$def.remove();
		$title.remove();
		$desc.remove();

		// If there is no title use the filename
		title = title || id;

		// Generate symbol
		var $res = cheerio.load('<symbol>' + $svg.html() + '</symbol>', { xmlMode: true });
		var $symbol = $res('symbol').first();

		// Merge in symbol attributes from option
		for (var attr in options.symbol) {
			$symbol.attr(attr, options.symbol[attr]);
		}

		// Add title and desc (if provided)
		if (desc && options.preserveDescElement) {
			$symbol.prepend('<desc>' + desc + '</desc>');
		}

		if (title && options.includeTitleElement) {
			$symbol.prepend('<title>' + title + '</title>');
		}

		// Add viewBox (if present on SVG w/ optional width/height fallback)
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

		// Add ID to symbol
		var graphicId = options.prefix + id;
		$symbol.attr('id', graphicId);

		// Extract gradients and pattern
		var addToDefs = function(){
			var $elem = $res(this);
			$resultDefs.append($elem.toString());
			$elem.remove();
		};

		$res('linearGradient').each(addToDefs);
		$res('radialGradient').each(addToDefs);
		$res('pattern').each(addToDefs);

		// Append <symbol> to resulting SVG
		$resultSvg.append($res.html());

		// Add icon to the demo.html array
		if (!!options.includedemo) {
			iconNameViewBoxArray.push({
				name: graphicId,
				title: title
			});
		}

		if (viewBox && !!options.fixedSizeVersion) {
			var fixedWidth = options.fixedSizeVersion.width || 50;
			var fixedHeight = options.fixedSizeVersion.width || 50;
			var $resFixed = cheerio.load('<symbol><use></use></symbol>', { lowerCaseAttributeNames: false });
			var fixedId = graphicId + (options.fixedSizeVersion.suffix || '-fixed-size');
			var $symbolFixed = $resFixed('symbol')
				.first()
				.attr('viewBox', [0, 0, fixedWidth, fixedHeight].join(' '))
				.attr('id', fixedId);
			Object.keys(options.symbol).forEach(function (key) {
				$symbolFixed.attr(key, options.symbol[key]);
			});
			if (desc) {
				$symbolFixed.prepend('<desc>' + desc + '</desc>');
			}
			if (title) {
				$symbolFixed.prepend('<title>' + title + '</title>');
			}
			var originalViewBox = viewBox
				.split(' ')
				.map(function (string) {
					return parseInt(string);
				});

			var translationX = ((fixedWidth - originalViewBox[2]) / 2) + originalViewBox[0];
			var translationY = ((fixedHeight - originalViewBox[3]) / 2) + originalViewBox[1];
			var scale = Math.max.apply(null, [originalViewBox[2], originalViewBox[3]]) /
				Math.max.apply(null, [fixedWidth, fixedHeight]);

			$symbolFixed
				.find('use')
				.attr('xlink:href', '#' + fixedId)
				.attr('transform', [
					'scale(' + parseFloat(scale.toFixed(options.fixedSizeVersion.maxDigits.scale || 4)).toPrecision() + ')',
					'translate(' + [
						parseFloat(translationX.toFixed(options.fixedSizeVersion.maxDigits.translation || 4)).toPrecision(),
						parseFloat(translationY.toFixed(options.fixedSizeVersion.maxDigits.translation || 4)).toPrecision()
					].join(', ') + ')'
				].join(' '));

			$resultSvg.append($resFixed.html());
			if (options.includedemo) {
				iconNameViewBoxArray.push({
					name: fixedId
				});
			}
		}

		if (options.externalDefs) {
			var filepath = options.externalDefs;
			var temp = yield readFile(filepath);

			if (!temp) {
				console.log(chalk.red('% does not exist'), filepath);
				continue;
			}

			var $file = cheerio.load(temp, {
						xmlMode: true,
						normalizeWhitespace: true
					}),
					defs = $file('defs').html();

			if (defs === null) {
				console.log(chalk.yellow('% contains no defs'), filepath);
			} else {
				$resultDefs.append(defs);
			}
		}

		// Remove defs block if empty
		if ($resultDefs.html().trim() === '') {
			$resultDefs.remove();
		}

		var destName = path.basename(options.output, '.svg');

		yield writeFile(options.output, result);
		console.log(chalk.green('% created'), options.output);

		if (!!options.includedemo) {
			$resultSvg.attr('style', 'width:0;height:0;visibility:hidden;');

			var demoHTML;
			var viewData = {
				svg : $resultDocument.html(),
				icons : iconNameViewBoxArray
			};

			if (typeof options.includedemo === 'function'){
				demoHTML = options.includedemo(viewData);
			} else{
				var template = yield readFile('./demo.mustache');
				if (typeof options.includedemo === 'string'){
					template = options.includedemo;
				}
				demoHTML = hogan.compile(template)(viewData);
			}

			var demoPath = path.resolve(path.dirname(options.output), destName + '-demo.html');
			yield writeFile(demoPath, demoHTML);
			console.log(chalk.green('% created'), demoPath);
		}
	};
};

Shelf.prototype._id = function(name) {
	var dotPos = name.indexOf('.');
	if ( dotPos > -1){
		name = name.substring(0, dotPos);
	}
	return name;
};

Shelf.prototype._get_id = function(name) {
	var dotPos = name.indexOf('.');
	if ( dotPos > -1){
		name = name.substring(0, dotPos);
	}
	return name;
};

Shelf.prototype._get_uid = function(oldId) {
	return id + "-" + oldId;
};
