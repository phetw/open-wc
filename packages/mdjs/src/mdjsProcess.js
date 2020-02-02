/** @typedef {import('./types').Story} Story */
/** @typedef {import('./types').ParseResult} ParseResult */
/** @typedef {import('./types').ProcessResult} ProcessResult */

const unified = require('unified');
const markdown = require('remark-parse');
const remark2rehype = require('remark-rehype');
const raw = require('rehype-raw');
const htmlStringify = require('rehype-stringify');
const htmlSlug = require('rehype-slug');
const htmlHeading = require('rehype-autolink-headings');

const { mdjsParse } = require('./mdjsParse.js');
const { mdjsStoryParse } = require('./mdjsStoryParse.js');

async function mdjsProcessDocument(mdjs, { counter }) {
  const parser = unified()
    .use(markdown)
    .use(mdjsParse)
    .use(mdjsStoryParse, { counter })
    .use(remark2rehype, { allowDangerousHTML: true })
    .use(raw)
    .use(htmlSlug)
    .use(htmlHeading)
    .use(htmlStringify);

  /** @type {unknown} */
  const parseResult = await parser.process(mdjs);
  const result = /** @type {ParseResult} */ (parseResult);

  const { stories, jsCode } = result.data;
  return { stories, jsCode, html: result.contents };
}

/**
 * @param {string[]} mdjsDocuments
 * @returns {Promise<ProcessResult>}
 */
async function mdjsProcess(mdjsDocuments) {
  const allHtml = [];
  let allStories = [];
  const allJsCode = [];

  for (const mdjs of mdjsDocuments) {
    // eslint-disable-next-line no-await-in-loop
    const { stories, jsCode, html } = await mdjsProcessDocument(mdjs, {
      counter: allStories.length,
    });
    allHtml.push(html);
    allStories = [...allStories, ...stories];
    allJsCode.push(jsCode);
  }
  const storiesCode = allStories.map(story => story.code).join('\n');
  const storiesKeys = allStories.map(story => story.key);

  const fullJsCode = [
    `import '@wcd/dakmor.mdjs-story/dist/mdjs-story.js';`,
    `import { html } from 'lit-html';`,
    allJsCode.join('\n'),
    storiesCode,
    `const stories = [${storiesKeys.join(', ')}];`,
    `stories.forEach((story, i) => {`,
    `  document.getElementById('mdjs-story-' + i).story = story;`,
    `});`,
  ].join('\n');
  return { jsCode: fullJsCode, allHtml };
}

module.exports = {
  mdjsProcess,
};
