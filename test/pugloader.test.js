const PugLoader = require('../lib/loader');
const utils = require('./utils');
const assert = require('assert');
const path = require('path');

describe('Pugloader', () => {
  const loader = new PugLoader('.');

  it('`extends` and `include`', () => {
    loader.entry = utils.resolve('./case/page-a.pug');

    const { content } = loader.load();
    utils.checkResult(content, 'extends-include');
  });

  it('embbed `block`', () => {
    loader.entry = utils.resolve('./case/sub-layout.pug');
    const { content } = loader.load();
    utils.checkResult(content, 'embbed-block');
  });

  it('multiply inheritance', () => {
    loader.entry = utils.resolve('./case/page-b.pug');
    const { content } = loader.load();
    utils.checkResult(content, 'multi-inheritance');
  });

  it('`block append <blockname>`', () => {
    loader.entry = utils.resolve('./case/page-append1.pug');
    const { content } = loader.load();
    utils.checkResult(content, 'block-append');
  });

  it('append <blockname>`', () => {
    loader.entry = utils.resolve('./case/page-append2.pug');
    const { content } = loader.load();
    utils.checkResult(content, 'append');
  });

  it('`block prepend <blockname>`', () => {
    loader.entry = utils.resolve('./case/page-prepend1.pug');
    const { content } = loader.load();
    utils.checkResult(content, 'block-prepend');
  });

  it('prepend <blockname>`', () => {
    loader.entry = utils.resolve('./case/page-prepend2.pug');
    const { content } = loader.load();
    utils.checkResult(content, 'prepend');
  });

  it('img:src requirement', () => {
    loader.entry = utils.resolve('./case/page-require.pug');
    const { content, deps } = loader.load();
    const imgRequires = [
      path.resolve(__dirname, 'img.png'),
    ];
    for (const require of imgRequires) {
      assert(deps.includes(require));
    }
    utils.checkResult(content, 'img-require');
  });

  it(':src requirement', () => {
    const loader = new PugLoader(utils.resolve('./case/page-require2.pug'), {
      attrs: [
        ':src',
      ],
    });

    const { content, deps } = loader.load();
    const imgRequires = [
      path.resolve(__dirname, 'img.png'),
    ];
    for (const require of imgRequires) {
      assert(deps.includes(require));
    }
    utils.checkResult(content, 'src-require');
  });

  it(':data-src requirement', () => {
    const loader = new PugLoader(utils.resolve('./case/page-require2.pug'), {
      attrs: [
        ':data-src',
      ],
    });

    const { content, deps } = loader.load();
    const imgRequires = [
      path.resolve(__dirname, 'img.png'),
    ];
    for (const require of imgRequires) {
      assert(deps.includes(require));
    }
    utils.checkResult(content, 'data-src-require');
  });

  it(':src sub requirement', () => {
    const loader = new PugLoader(utils.resolve('./case/sub/sub-require.pug'), {
      attrs: [
        ':src',
      ],
    });

    const { content, deps } = loader.load();
    const imgRequires = [
      path.resolve(__dirname, 'img.png'),
      path.resolve(__dirname, 'case/footer.png'),
    ];
    for (const require of imgRequires) {
      assert(deps.includes(require));
      assert.equal(deps.length, imgRequires.length);
    }
    utils.checkResult(content, 'sub-require');
  });
});

