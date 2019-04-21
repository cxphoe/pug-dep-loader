const chalk = require('chalk');
const pkg = require('../package.json');

exports.log = console.log.bind(console, chalk.cyan(pkg.name));

