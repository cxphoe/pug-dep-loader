const assert = require('assert');
const path = require('path');
const utils = require('../utils');
const PugStat = require('./pugStat');
const Parser = require('./parser');
const getOptions = require('./getOptions');

class PugLoader {
  constructor(entry, options = {}) {
    assert.notEqual(entry, undefined, 'entry for pug loader is necessary');

    this.entry = entry;
    /** @type {{[key: string]: PugStat}} */
    this._cache = {};
    this.options = getOptions(options);
    this.parser = new Parser({
      requireAttrs: this.options.attrs,
    });
  }

  load() {
    return this.retrieveContent(this.entry);
  }

  getStat(filepath) {
    const ps = this._cache[filepath] || new PugStat(filepath, this);
    this._cache[filepath] = ps;

    if (ps.stat.mtime !== ps.getNowStat().mtime) {
      ps.update();
    }

    return ps;
  }

  traverseNodes(nodes, context, compiledBlocks = {}) {
    /** @type {{[filepath: string]: string[]}} */
    let deps = {};

    const handlers = {
      include: (node) => {
        const { indent, value } = node;
        const filepath = path.resolve(context, value);
        const includeInfo = this.retrieveContent(filepath);

        deps = {
          ...deps,
          ...includeInfo.deps,
        };
        return {
          indent,
          type: 'text',
          statement: includeInfo.content,
        };
      },
      block: (node) => {
        const { nodes, value: blockName } = node;
        const compiledBlock = compiledBlocks[blockName];
        const prependNodes = [];
        const appendNodes = [];

        if (compiledBlock) {
          const { mode, nodes: compiledNodes } = compiledBlock;
          compiledNodes.forEach((textNode) => {
            textNode.indent += node.indent;
          });

          if (!mode) {
            return compiledNodes;
          }

          mode === 'append'
            ? appendNodes.push(...compiledNodes)
            : prependNodes.push(...compiledNodes);
        }

        const {
          nodes: textNodes,
          deps: blockDeps,
        } = this.traverseNodes(nodes, context, compiledBlocks);
        deps = {
          ...deps,
          ...blockDeps,
        };

        const resultNodes = [
          ...prependNodes,
          ...textNodes,
          ...appendNodes,
        ];

        textNodes.forEach((node) => {
          node.indent -= this.options.indentUnit;
        });

        return resultNodes;
      },
    };

    const result = [];
    for (const node of nodes) {
      const handler = handlers[node.type];
      if (!handler) {
        result.push(node);
      } else {
        const handleResult = handler(node);
        Array.isArray(handleResult)
          ? result.push(...handleResult)
          : result.push(handleResult);
      }
    }
    return {
      nodes: result,
      deps,
    };
  }

  /**
   * @returns {{content: string, deps: {[filepath: string]: string[]}}}
   */
  retrieveContent(filepath, compiledBlocks = {}) {
    const stat = this.getStat(filepath);
    const { file, dirname } = stat;
    const {
      nodes,
      deps,
    } = this.parser.parse(file, dirname);

    let i = 0;
    let extendsNode = null;
    while (i < nodes.length) {
      if (nodes[i].type === 'extends') {
        extendsNode = nodes[i];
        break;
      }
      i++;
    }

    if (extendsNode !== null) {
      // restNodes is all block
      const restNodes = nodes.slice(i + 1);
      let depsOfNodes = {};
      const newCompiledBlocks = {};
      for (const node of restNodes) {
        const blockInfo = this.traverseNodes(
          node.nodes,
          dirname,
          compiledBlocks
        );
        depsOfNodes = {
          ...depsOfNodes,
          ...blockInfo.deps,
        };
        const textNodes = blockInfo.nodes;
        textNodes.forEach((textNode) => {
          // remove block indentation
          textNode.indent -= this.options.indentUnit;
        });

        newCompiledBlocks[node.value] = {
          mode: node.mode,
          nodes: textNodes,
        };
      }
      compiledBlocks = {
        ...newCompiledBlocks,
        ...compiledBlocks,
      };
      const { value: extendFile } = extendsNode;
      const extendEntry = path.resolve(dirname, extendFile);
      const retrieveRes = this.retrieveContent(extendEntry, compiledBlocks);

      return {
        content: retrieveRes.content,
        deps: {
          [filepath]: deps,
          ...depsOfNodes,
          ...retrieveRes.deps,
        },
      };
    }

    const {
      nodes: textNodes,
      deps: depsOfNodes,
    } = this.traverseNodes(nodes, dirname, compiledBlocks);
    return {
      content: textNodes
        .map((node) => utils.indent(node.statement, node.indent))
        .join(this.options.linebreak),
      deps: {
        [filepath]: deps,
        ...depsOfNodes,
      },
    };
  }
}

module.exports = PugLoader;
