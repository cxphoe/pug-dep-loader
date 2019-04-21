const utils = require('../utils');
const assert = require('assert');

describe('utils', () => {
  it('merge arrays', () => {
    const merged = utils.mergeArrays([1, 2, 3, 7], [3, 2, 1, 4]);
    assert(merged.includes(1));
    assert(merged.includes(2));
    assert(merged.includes(3));
    assert(merged.includes(4));
    assert(merged.includes(7));
  });
});
