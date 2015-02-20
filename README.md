
svgshelf
========

[![npm version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]

A simple CLI for merging multiple svg into a single file, for nodejs/iojs.


# Motivation

We use `npm run build` as our build tool, and since [svgo](https://github.com/svg/svgo) already does the hard work of optimizing our svg files, this is a command line tool to help us with the last step: bundling svg into a single file, so you can reference it as a cachable external file, through [svg `use()`](http://css-tricks.com/svg-use-external-source/).

Much of the idea here is based on [grunt-svgstore](https://github.com/FWeinb/grunt-svgstore) and [gulp-svgstore](https://github.com/w0rm/gulp-svgstore), which are perfectly fine if you use grunt/gulp, but if all you need is a simple CLI, `svgshelf` got your covered.


# Install

`npm install svgshelf --save-dev` or `npm install svgshelf -g`


# Usage

As a command, escape `*` to prevent bash glob expansion

`svgshelf svg/input/\*.svg svg/output/result.svg`

As a npm build tool, escape `\` since we are in a string

```
{
	"scripts": {
		"build": "svgo -f svg/input/ && svgshelf svg/input/\\*.svg svg/output/result.svg"
	}
}
```


## Additional arguments

All options are disabled by default.

- `-d` output a demo html alongaside of result svg
- `-b` format and beautify output svg
- `-p prefix` add a prefix to each svg icon, so if it was `result.svg#button`, it would be `result.svg#prefixbutton`


## Current limits

- For node.js, you need v0.11+ for this module to work properly, and so far both v0.11 and v0.12 require you to set `node --harmony` flag to work with generator, and yes, it's a pain.
- For complex svg that make use of `url()` linking, merging them may break url reference. We don't expect this to be a problem for svg icons.
- We may support more types of [svg merging (or stacking) in future](http://css-tricks.com/svg-fragment-identifiers-work/), but `<use>` with a polyfil like [svg4everybody](https://github.com/jonathantneal/svg4everybody) appear to give better coverage (on desktop and mobile).


# License

MIT

[npm-image]: https://img.shields.io/npm/v/svgshelf.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/svgshelf
[travis-image]: https://img.shields.io/travis/bitinn/svgshelf.svg?style=flat-square
[travis-url]: https://travis-ci.org/bitinn/svgshelf
