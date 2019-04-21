const utils = require('../utils');
const lex = require('pug-lexer');
const path = require('path');

const regex = {
  include: /^(\s+)include\s+(\S+)/,
  extends: /^extends\s+(\S+)/,
  block: /^(\s*)(block(\s+(append|prepend))?|(append|prepend))\s+(\S+)/,
};

const checkNode = {
  include(line) {
    const match = line.match(regex.include);
    if (match) {
      const indentContent = match[1] || '';
      return {
        type: 'include',
        indent: indentContent.length,
        statement: line.trim(),
        value: match[2],
      };
    }
  },
  extends(line) {
    const match = line.match(regex.extends);
    if (match) {
      return {
        type: 'extends',
        indent: 0,
        statement: line.trim(),
        value: match[1],
      };
    }
  },
  block(line) {
    const match = line.match(regex.block);
    if (match) {
      const indentContent = match[1] || '';
      return {
        type: 'block',
        mode: match[4] || match[5],
        indent: indentContent.length,
        statement: line.trim(),
        value: match[6],
      };
    }
  },
};

class Parser {
  /**
   * @param {Object} options
   * @param {string[]} options.requireAttrs
   */
  constructor(options) {
    this.nodes = [];
    this.blocks = [];
    this.options = options;
  }

  attrMatch(attr, tag = '') {
    const valWithTag = `${tag}:${attr}`;
    const valWitoutTag = `:${attr}`;
    const { requireAttrs } = this.options;
    return requireAttrs.includes(valWithTag) || requireAttrs.includes(valWitoutTag);
  }

  reset() {
    this.nodes = [];
    this.blocks = [];
  }

  parse(content, dirpath) {
    this.reset();
    const {
      content: retrieved,
      deps,
    } = this.retrieveDeps(content, dirpath);

    const lines = utils.getValidLines(retrieved);
    lines.forEach((line) => this.pushLine(line));
    return {
      nodes: this.flush(),
      deps,
    };
  }

  /**
   * @param {string} content pug template content
   * @param {string} dirpath directory path fo pug template
   */
  retrieveDeps(content, dirpath) {
    let retrievedContent = content;

    const tokens = lex(content);
    /** @type {Set<string>} */
    const deps = new Set();
    let currentTag = null;
    for (const tok of tokens) {
      if (tok.type === 'tag') {
        currentTag = tok.val;
      } else if (
        tok.type === 'attribute'
        && this.attrMatch(tok.name, currentTag)
      ) {
        const val = tok.val.trim();
        const filepath = ['\'', '"'].includes(val[0])
          ? val.replace(new RegExp(val[0], 'g'), '')
          : val;

        if (!path.isAbsolute(filepath)) {
          const abosulutePath = path.resolve(dirpath, filepath);
          const regex = new RegExp(
            `(${currentTag}.*\\(\\s*(\\S+=\\S+[\\s,]+)*${tok.name}\\s*=.*)${utils.pathEscape(filepath)}`
          );
          retrievedContent = retrievedContent.replace(regex, `$1${abosulutePath}`);

          deps.add(abosulutePath);
        }
      }
    }

    return {
      content: retrievedContent,
      deps: [...deps],
    };
  }

  parseLine(line) {
    for (const checker of Object.values(checkNode)) {
      const node = checker(line);
      if (node) {
        return node;
      }
    }
    const indentContent = line.match(/^\s*/)[0] || '';
    return {
      type: 'text',
      indent: indentContent.length,
      statement: line.trim(),
    };
  }

  findBelongedBlock(node) {
    const { blocks } = this;
    let belongedBlock = null;
    while (blocks.length > 0 && !belongedBlock) {
      const lastBlock = blocks[blocks.length - 1];
      if (node.indent > lastBlock.indent) {
        belongedBlock = lastBlock;
      } else {
        blocks.pop();
      }
    }
    return belongedBlock;
  }

  pushLine(line) {
    const node = this.parseLine(line);
    const belongedBlock = this.findBelongedBlock(node);

    if (belongedBlock === null) {
      this.nodes.push(node);
    } else {
      belongedBlock.nodes.push(node);
    }

    if (node.type === 'block') {
      node.nodes = [];
      this.blocks.push(node);
    }
  }

  flush() {
    const { nodes } = this;
    this.nodes = [];
    return nodes;
  }
}

module.exports = Parser;
