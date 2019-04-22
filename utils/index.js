const path = require('path');
const slash = require('slash');
const chalk = require('chalk');

exports.getLineBreak = function (str) {
  if (!str) return '\n';
  const probs = ['\r\n', '\r', '\n'];
  for (const lb of probs) {
    if (str.indexOf(lb) > -1) {
      return lb;
    }
  }
  return '\n';
};

/** get indent of a line */
exports.getLineIndent = function (line) {
  if (!line) {
    return '';
  }
  const lb = exports.getLineBreak(line);
  // erase linebreak in case that it will have an influence on the calculation of indent
  line = exports.replaceAll(line, lb);
  const result = line.match(/^\s+/);
  return result ? result[0] : '';
};

exports.resolve = function (dirpath, filepath) {
  return slash(path.resolve(dirpath, filepath));
};

exports.log = function () {
  const args = Array.prototype.slice.call(arguments);
  const log = console.log.bind(null, '>>>');
  return log.apply(null, args);
};

/**
 * simple implementation of Object.assign in ES6
 */
exports.objectAssign = function (obj1, obj2) {
  for (const key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      obj1[key] = obj2[key];
    }
  }
  return obj1;
};

/**
 * joint scripts to require resources, and save the result in an object
 * @param {{[filepath: string]: string[]}} filepaths absolute paths of local depedencies
 * @param {string} resultObjName the name of object that will save the require result of dependencies
 */
exports.requireAllResources = function (filepaths, resultObjName = 'requirePaths') {
  const scripts = [
    `var ${resultObjName} = {}`,
    ...exports.mergeArrays(...Object.keys(filepaths).map(
      (key) => filepaths[key].map((filepath) => `
try {
  ${resultObjName}['${filepath}'] = require('${slash(filepath)}');
} catch (error) {
  throw new Error('${chalk.red('Error in ') + chalk.cyan(key)}:\n' + error.message);
}
      `
      ))),
  ];
  return scripts.join('\n');
};

exports.replaceAll = function (str, target, replacement) {
  replacement = replacement || '';
  const parts = str.split(target);
  return parts.join(replacement);
};

/**
 * ajust indent of a piece of string
 * @param {string} str content that need to be indented
 * @param {number} count unit according to `indentChar`
 * @param {string} indentChar indent character, default to ' '
 */
exports.indent = function (str, count, indentChar) {
  if (!str || count === 0) {
    return str;
  }

  indentChar = indentChar || ' ';
  const lb = exports.getLineBreak(str);
  const indentation = indentChar.repeat(Math.abs(count));
  const lines = exports.getValidLines(str, lb);
  const content = lines
    .map(function (line) {
      if (count < 0) {
        line = line.replace(indentation, '');
      } else {
        line = indentation + line;
      }
      return line;
    })
    .join(lb);

  return content;
};

/**
 * @param {string} content
 * @param {string=} spliter
 */
exports.getValidLines = function (content, spliter) {
  if (!content) {
    return [];
  }

  spliter = spliter || exports.getLineBreak(content);
  const lines = content
    .split(spliter)
    .filter((line) => line.trim().length > 0);
  return lines;
};

/**
 * get linebreak unit of a piece of content
 * @param {{content: string, lines?: [string]}} options
 * @returns {string} linebreak unit
 */
exports.getIndentUnit = function (options) {
  const content = options.content;
  const lines = options.lines || exports.getValidLines(content);

  for (const line of lines) {
    const indent = exports.getLineIndent(line);
    if (indent.length > 0) {
      return indent;
    }
  }
  return null;
};

/**
 * normalize the indent of a piece of content: transform tab into space, with 2 spaces as default unit
 * @param {string} content
 * @param {number} unit unit of space
 * @returns {string}
 */
exports.indentNormalize = function (content, unit = 2) {
  // indent of first valid line is the exact indent unit of whole content,
  // when the content is under the right format
  let lines = exports.getValidLines(content);
  const indentUnit = exports.getIndentUnit({ lines });
  const normalized = ' '.repeat(unit);

  if (
    !indentUnit ||
    (indentUnit !== '\t' && indentUnit.length === unit)
  ) {
    return content;
  }

  lines = lines.map((line) => {
    const lineIndent = exports.getLineIndent(line);
    let count = lineIndent.length / indentUnit.length;

    while (count > 0) {
      line = line.replace(indentUnit, normalized);
      count--;
    }
    return line;
  });
  return lines.join(exports.getLineBreak(content));
};

exports.remainSplit = function (content, spliter) {
  const parts = [];
  let pos = content.indexOf(spliter);
  while (pos > -1) {
    parts.push(content.substring(0, pos), spliter);
    content = content.substring(pos + spliter.length);
    pos = content.indexOf(spliter);
  }
  parts.push(content);
  return parts;
};

exports.linebreakFormat = function (content, format = '\n') {
  const lb = exports.getLineBreak(content);
  return content.split(lb).join(format);
};

exports.pathEscape = function (string) {
  const specialChars = '(){}[].\\/^$';
  const regex = new RegExp(`([${specialChars.split('').map((c) => `\\${c}`).join('')}])`, 'g');
  return string.replace(regex, '\\$1');
};

exports.mergeArrays = function (...args) {
  return args.reduce((prevArr, curArr) => {
    return [...new Set([
      ...prevArr,
      ...curArr,
    ])];
  }, []);
};
