/* eslint-disable no-template-curly-in-string */

const chai = require('chai');
const { mdjsProcess } = require('../src/mdjsProcess.js');

const { expect } = chai;

describe('mdjsProcess', () => {
  const input = [
    'Intro',
    '```js',
    'const foo = 1;',
    '```',
    '```js script',
    'const bar = 2;',
    '```',
    '```js story',
    'export const fooStory = () => {}',
    '```',
    '```js preview-story',
    'export const fooPreviewStory = () => {}',
    '```',
  ].join('\n');

  it('extracts code blocks with "js story" and "js preview-story" and places marker tags', async () => {
    const expected = [
      '<p>Intro</p>',
      '<pre><code class="language-js">const foo = 1;',
      '</code></pre>',
      '<mdjs-story name="fooStory" id="mdjs-story-0"></mdjs-story>',
      '<mdjs-preview name="fooPreviewStory" id="mdjs-story-1"></mdjs-preview>',
    ].join('\n');
    const expectedJsCode = [
      "import '@wcd/dakmor.mdjs-story/dist/mdjs-story.js';",
      "import { html } from 'lit-html';",
      'const bar = 2;',
      'export const fooStory = () => {}',
      'export const fooPreviewStory = () => {}',
      'const stories = [fooStory, fooPreviewStory];',
      'stories.forEach((story, i) => {',
      "  document.getElementById('mdjs-story-' + i).story = story;",
      '});',
    ].join('\n');

    const result = await mdjsProcess([input]);
    expect(result.allHtml.length).to.equal(1);
    expect(result.allHtml[0]).to.equal(expected);
    expect(result.jsCode).to.equal(expectedJsCode);
  });

  it('can work with multiple md inputs', async () => {
    const input1 = [
      // prettier don't wrap
      'I am one',
      '```js story',
      'export const fooStory = () => {}',
      '```',
    ].join('\n');
    const input2 = [
      'Number two here',
      '```js story',
      'export const barStory = () => {}',
      '```',
    ].join('\n');

    const expectedHtml1 = [
      '<p>I am one</p>',
      '<mdjs-story name="fooStory" id="mdjs-story-0"></mdjs-story>',
    ].join('\n');
    const expectedHtml2 = [
      '<p>Number two here</p>',
      '<mdjs-story name="barStory" id="mdjs-story-1"></mdjs-story>',
    ].join('\n');

    const expectedJsCode = [
      "import '@wcd/dakmor.mdjs-story/dist/mdjs-story.js';",
      "import { html } from 'lit-html';",
      '',
      '',
      'export const fooStory = () => {}',
      'export const barStory = () => {}',
      'const stories = [fooStory, barStory];',
      'stories.forEach((story, i) => {',
      "  document.getElementById('mdjs-story-' + i).story = story;",
      '});',
    ].join('\n');

    const result = await mdjsProcess([input1, input2]);
    expect(result.allHtml).to.deep.equal([expectedHtml1, expectedHtml2]);
    expect(result.jsCode).to.equal(expectedJsCode);
  });

  // it('allows to configure the marker tags', async () => {
  //   const expected = [
  //     '<h2>Intro</h2>',
  //     '<pre><code class="language-js">const foo = 1;',
  //     '</code></pre>',
  //     '<Story name="fooStory"></Story>',
  //     '<Preview><Story name="fooPreviewStory"></Story></Preview>',
  //     '',
  //   ].join('\n');

  //   const result = await mdjsProcess([input], {
  //     storyTag: name => `<Story name="${name}"></Story>`,
  //     previewStoryTag: name => `<Preview><Story name="${name}"></Story></Preview>`,
  //   });

  //   expect(result.html).to.equal(expected);
  // });
});
