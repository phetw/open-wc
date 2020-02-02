/** @typedef {import('./types').Story} Story */
/** @typedef {(name: string, i: number) => string} TagFunction */
/** @typedef {import('unist').Node} UnistNode */

const visit = require('unist-util-visit');
const { init, parse } = require('es-module-lexer');

/**
 * @param {string} code
 * @returns {Story}
 */
function extractStoryData(code) {
  const parsed = parse(code);
  const key = parsed[1][0];
  const name = key;
  return { key, name, code };
}

/** @type {TagFunction} */
function defaultStoryTag(name, i) {
  return `<mdjs-story name="${name}" id="mdjs-story-${i}"></mdjs-story>`;
}

/**
 * @param {string} name
 * @param {number} i
 */
function defaultPreviewStoryTag(name, i) {
  return `<mdjs-preview name="${name}" id="mdjs-story-${i}"></mdjs-preview>`;
}

/**
 * @param {object} arg
 * @param {TagFunction} [arg.storyTag]
 * @param {TagFunction} [arg.previewStoryTag]
 * @param {number} [arg.counter]
 */
function mdjsStoryParse({
  storyTag = defaultStoryTag,
  previewStoryTag = defaultPreviewStoryTag,
  counter = 0,
} = {}) {
  /** @type {Story[]} */
  const stories = [];
  // const counter = 10;

  return async (tree, file) => {
    // unifiedjs expects node changes to be made on the given node...
    /* eslint-disable no-param-reassign */
    await init;
    visit(tree, 'code', node => {
      if (node.lang === 'js' && node.meta === 'story') {
        const storyData = extractStoryData(node.value);
        node.type = 'html';
        node.value = storyTag(storyData.name, counter);
        stories.push(storyData);
        counter += 1;
      }
      if (node.lang === 'js' && node.meta === 'preview-story') {
        const storyData = extractStoryData(node.value);
        node.type = 'html';
        node.value = previewStoryTag(storyData.name, counter);
        stories.push(storyData);
        counter += 1;
      }
    });
    // we can only return/modify the tree but stories should not be part of the tree
    // so we attach it globally to the file.data
    file.data.stories = stories;

    return tree;
    /* eslint-enable no-param-reassign */
  };
}

module.exports = {
  mdjsStoryParse,
};
