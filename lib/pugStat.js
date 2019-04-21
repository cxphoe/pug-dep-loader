const fs = require('fs');
const lex = require('pug-lexer');
const path = require('path');
const chalk = require('chalk');
const utils = require('../utils');

class PugStat {
  constructor (entry, loader) {
    if (!path.extname(entry)) {
      entry += '.pug';
    }
    this.path = entry;
    this.loader = loader;
    this.dirname = path.dirname(entry);
    this.stat = fs.statSync(entry);
    this.file = null;
    this.update();
  }

  update() {
    this.stat = this.getNowStat();
    this.file = this.getFile();
    this.tokens = lex(this.file);
  }

  getFile() {
    let file = fs.readFileSync(this.path, 'utf-8');
    try {
      // 通过 pug-lexer 检查语法
      // console.log(JSON.stringify(lex(file), null, ' '));
      lex(file);
    } catch (error) {
      console.log(chalk.red('in file:'), chalk.cyan(this.path));
      throw error;
    }
    file = utils.indentNormalize(file, this.loader.options.indentUnit);
    file = utils.linebreakFormat(file, this.loader.options.linebreak);
    return file;
  }

  getName(publicPath) {
    publicPath = publicPath || '';
    return path.relative(publicPath, this.path);
  }

  getNowStat() {
    return fs.statSync(this.path);
  }
}

module.exports = PugStat;
