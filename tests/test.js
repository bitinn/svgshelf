
// test tools
var chai = require('chai');
var expect = chai.expect;

// test subject
var Shelf = require('../lib/svgshelf');
var svgshelf;

describe('svgshelf', function() {

	it('should setup default options', function() {
		svgshelf = new Shelf({
			_: ['input/*.svg', 'output/result.svg']
		});
		expect(svgshelf.options.prefix).to.equal('');
		expect(svgshelf.options.demo).to.be.false;
		expect(svgshelf.options.beautify).to.be.false;
		expect(svgshelf.options.folder).to.equal('input/*.svg');
		expect(svgshelf.options.output).to.equal('output/result.svg');
	});

	it('should setup custom options', function() {
		svgshelf = new Shelf({
			_: ['input/*.svg', 'output/result.svg']
			, d: true
			, b: true
			, p: 'icon-'
		});
		expect(svgshelf.options.prefix).to.equal('icon-');
		expect(svgshelf.options.demo).to.be.true;
		expect(svgshelf.options.beautify).to.be.true;
		expect(svgshelf.options.folder).to.equal('input/*.svg');
		expect(svgshelf.options.output).to.equal('output/result.svg');
	});

});
