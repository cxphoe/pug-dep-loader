const path = require('path');
const fs = require('fs-extra');
const assert = require('assert');
const utils = require('../utils');

exports.resolve = (...args) => path.resolve(__dirname, ...args);

exports.checkResult = (actual, expectFilename) => {
  const expectFilepath = exports.resolve('expect', expectFilename + '.pug');
  const expect = fs.readFileSync(expectFilepath, { encoding: 'utf-8' });
  assert.equal(actual, expect);
};

/**
 * @param {{[filepath: string]: string[]}} obj
 */
exports.flatObjectValues = (obj) => {
  return utils.mergeArrays(...Object.values(obj));
};
