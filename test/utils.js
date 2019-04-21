const path = require('path');
const fs = require('fs-extra');
const assert = require('assert');

exports.resolve = (...args) => path.resolve(__dirname, ...args);

exports.checkResult = (actual, expectFilename) => {
  const expectFilepath = exports.resolve('expect', expectFilename + '.pug');
  const expect = fs.readFileSync(expectFilepath, { encoding: 'utf-8' });
  assert.equal(actual, expect);
};
