
// test tools
var chai = require('chai');
var sinon = require('sinon');
var sc = require('sinon-chai');
var cap = require('chai-as-promised');
chai.use(sc);
chai.use(cap);

var expect = chai.expect;

var co = require('co');
var fs = require('fs');
var denodeify = require('denodeify');
var cheerio = require('cheerio');

var readFile = denodeify(fs.readFile);
var writeFile = denodeify(fs.writeFile);
var deleteFile = denodeify(fs.unlink);

// test subject
var Shelf = require('../lib/svgshelf');
var svgshelf;

describe('svgshelf', function() {

	beforeEach(function() {
		return co(function *() {
		});
	});

	afterEach(function() {
		return co(function *() {
			try {
				yield deleteFile('tests/output/result.svg');
				yield deleteFile('tests/output/result-demo.html');
			} catch(e) {
				// no big deal if file doesn't exists
			}
		});
	});

	it('should setup default options', function() {
		svgshelf = new Shelf({
			_: ['tests/input/*.svg', 'tests/output/result.svg']
		});
		expect(svgshelf.options.prefix).to.equal('');
		expect(svgshelf.options.demo).to.be.false;
		expect(svgshelf.options.beautify).to.be.false;
		expect(svgshelf.options.folder).to.equal('tests/input/*.svg');
		expect(svgshelf.options.output).to.equal('tests/output/result.svg');
	});

	it('should setup custom options', function() {
		svgshelf = new Shelf({
			_: ['tests/input/*.svg', 'tests/output/result.svg']
			, d: true
			, b: true
			, p: 'icon-'
		});
		expect(svgshelf.options.prefix).to.equal('icon-');
		expect(svgshelf.options.demo).to.be.true;
		expect(svgshelf.options.beautify).to.be.true;
	});

	it('should print usage if required arguments are missing', function() {
		//var log = sinon.stub(console, 'log');
		svgshelf = new Shelf({
			_: ['tests/input/*.svg']
		});
		expect(svgshelf.options).to.be.undefined;
		//expect(log).to.have.been.calledOnce;
		//log.restore();
	});

	it('should merge svg correctly', function() {
		//var log = sinon.stub(console, 'log');
		svgshelf = new Shelf({
			_: ['tests/input/*.svg', 'tests/output/result.svg']
		});
		return co(svgshelf.run).then(function() {
			//log.restore();
			return readFile('tests/output/result.svg');
		}).then(function(file) {
			var $ = cheerio.load(file, { xmlMode: true });
			expect($('symbol').length).to.equal(4);
			expect($('symbol#arrow_down').length).to.equal(1);
			expect($('symbol#arrow_left').length).to.equal(1);
			expect($('symbol#arrow_right').length).to.equal(1);
			expect($('symbol#arrow_up').length).to.equal(1);
			expect(file.toString().indexOf('\n')).to.equal(-1);
		});
	});

	it('should merge svg with prefix', function() {
		//var log = sinon.stub(console, 'log');
		svgshelf = new Shelf({
			_: ['tests/input/*.svg', 'tests/output/result.svg']
			, p: ['icon_']
		});
		return co(svgshelf.run).then(function() {
			//log.restore();
			return readFile('tests/output/result.svg');
		}).then(function(file) {
			var $ = cheerio.load(file, { xmlMode: true });
			expect($('symbol').length).to.equal(4);
			expect($('symbol#icon_arrow_down').length).to.equal(1);
		});
	});

	it('should merge svg with demo', function() {
		//var log = sinon.stub(console, 'log');
		svgshelf = new Shelf({
			_: ['tests/input/*.svg', 'tests/output/result.svg']
			, d: true
		});
		return co(svgshelf.run).then(function() {
			//log.restore();
			return readFile('tests/output/result-demo.html');
		}).then(function(file) {
			var $ = cheerio.load(file);
			expect($('title').html()).to.equal('svgshelf usage demo');
		});
	});

	it('should merge svg and beautify output', function() {
		//var log = sinon.stub(console, 'log');
		svgshelf = new Shelf({
			_: ['tests/input/*.svg', 'tests/output/result.svg']
			, b: true
		});
		return co(svgshelf.run).then(function() {
			//log.restore();
			return readFile('tests/output/result.svg');
		}).then(function(file) {
			expect(file.toString().indexOf('\n')).to.not.equal(-1);
		});
	});

});
