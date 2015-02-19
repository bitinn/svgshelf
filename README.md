
svgshelf
========

[![npm version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]

A simple CLI for shelving (or merging, stacking, bundling) multiple svg into a single file, for nodejs/iojs.


# Motivation

We use `npm run build` as our build tool, and since [svgo](https://github.com/svg/svgo) already does the hard work of optimizing our svg files, this is a command line tool to help us with the last step: bundling svg into a single file, so you can reference it as a cachable, single external file, through fragment identifier.

And much of the code here are forked from [grunt-svgstore](https://github.com/FWeinb/grunt-svgstore), which is perfectly fine if you use grunt, but if all you need is a simple CLI, `svgshelf` got your covered.


# Install

`npm install svgshelf --save-dev` or `npm install svgshelf -g`


# Usage

`svgshelf -f svg/folder/ -o output/single.svg`


# License

MIT

[npm-image]: https://img.shields.io/npm/v/svgshelf.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/svgshelf
[travis-image]: https://img.shields.io/travis/bitinn/svgshelf.svg?style=flat-square
[travis-url]: https://travis-ci.org/bitinn/svgshelf
