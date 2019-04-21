const loaderUtils = require('loader-utils');
const utils = require('./utils');
const PugLoader = require('./lib/loader');

const getScript = (fileInfo) => {
  // get scripts executed in webpack, which will replace path of all depedencies
  let script = utils.requireAllResources(fileInfo.deps, 'requirePaths');
  script += `
    var tpl = ${JSON.stringify(fileInfo.content)};
    for (var originPath in requirePaths) {
      if (requirePaths.hasOwnProperty(originPath)) {
        var rp = requirePaths[originPath];
        while (tpl.indexOf(originPath) > -1) {
          tpl = tpl.replace(originPath, '"' + rp + '"');
        }
      }
    }
    module.exports = tpl;`;
  return script;
};

module.exports = function () {
  const options = loaderUtils.getOptions(this);
  const loader = new PugLoader(this.resourcePath, options);
  const fileInfo = loader.load();
  return getScript(fileInfo);
};
