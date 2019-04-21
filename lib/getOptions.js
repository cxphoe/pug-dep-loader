const defaults = {
  indentUnit: 2,
  linebreak: '\n',
  attrs: ['img:src'],
};

const getOptions = (rawOptions = {}) => {
  const options = {
    ...defaults,
    ...rawOptions,
  };

  options.attrs = options.attrs || [];
  options.attrs = options.attrs.map((val) => {
    const v = val.trim();
    if (!/^.*:.+$/.test(v)) {
      throw new Error(`[pug-dep-loader] \`${val}\` in options.attrs is invalid. Expect: \`[string]:string\``);
    }

    return v;
  });

  return options;
};

module.exports = getOptions;
