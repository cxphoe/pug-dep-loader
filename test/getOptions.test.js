const getOptions = require('../lib/getOptions');
const assert = require('assert');

describe('getOptions', () => {
  it('attrs with tag', () => {
    const { attrs } = getOptions({
      attrs: [
        'img:src',
      ],
    });
    assert.equal(attrs[0], 'img:src');
  });

  it('attrs without tag', () => {
    const { attrs } = getOptions({
      attrs: [
        ':data-src',
      ],
    });
    assert.equal(attrs[0], ':data-src');
  });

  it('attrs without attr', () => {
    try {
      getOptions({
        attrs: [
          'img:',
        ],
      });
    } catch (error) {
      return;
    }

    throw new Error('expect failure when attrs without attr');
  });
});
