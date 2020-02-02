const chai = require('chai');
const { moveImportsToTop } = require('../src/moveImportsToTop.js');

const { expect } = chai;

describe.only('moveImportsToTop', () => {
  it('finds and moves all imports to the top', async () => {
    const input = [
      "import { html } from 'lit-html';",
      'const foo = 1;',
      "import { html, LitElement } from 'lit-element';",
    ].join('\n');
    const expected = [
      "import { html } from 'lit-html';",
      "import { html, LitElement } from 'lit-element';",
      'const foo = 1;',
    ].join('\n');
    expect(moveImportsToTop(input)).to.equal(expected);
  });
});
