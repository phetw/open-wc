const fs = require('fs');
const { mdjsDocPage, resolveToUnpkg } = require('../../index.js');

const pkgJson = require('../../package.json');

module.exports = {
  open: 'packages/mdjs/demo/script/README.md',
  watch: true,
  responseTransformers: [
    async function mdJsTransformer({ url, body }) {
      if (url.endsWith('.md')) {
        return {
          body: await mdjsDocPage(body, {
            jsProcessor: async code => {
              return await resolveToUnpkg(code, pkgJson);
            },
          }),
          contentType: 'text/html',
        };
      }
      return null;
    },
  ],
};
