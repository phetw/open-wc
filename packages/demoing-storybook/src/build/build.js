const fs = require('fs-extra');
const path = require('path');
const createAssets = require('../shared/getAssets');
const toBrowserPath = require('../shared/toBrowserPath');
<<<<<<< HEAD
const { injectStories } = require('../shared/injectStories');

const injectOrderedExportsPlugin = storyFiles => ({
  async transform(code, id) {
    if (storyFiles.includes(id)) {
      const orderedExports = await createOrderedExports(code);
      if (!orderedExports) {
        return null;
      }

      // @ts-ignore
      const ms = new MagicString(code);
      ms.append(`\n\n${orderedExports}`);

      return {
        code: ms.toString(),
        map: ms.generateMap({ hires: true }),
      };
    }
    return null;
  },
});

function copyCustomElementsJsonPlugin(outputRootDir) {
  return {
    async generateBundle() {
      const files = await listFiles(
        `{,!(node_modules|web_modules|bower_components|${outputRootDir})/**/}custom-elements.json`,
        process.cwd(),
      );

      for (const file of files) {
        const destination = file.replace(process.cwd(), '');

        this.emitFile({
          type: 'asset',
          fileName: destination.substring(1, destination.length),
          source: fs.readFileSync(file, 'utf-8'),
        });
      }
    },
  };
}

async function rollupBuild(config) {
  const bundle = await rollup(config);
  await bundle.write(config.output);
}

const ignoredWarnings = ['EVAL', 'THIS_IS_UNDEFINED'];

function onwarn(warning, warn) {
  if (ignoredWarnings.includes(warning.code)) {
    return;
  }
  warn(warning);
}

const prebuiltDir = require.resolve('storybook-prebuilt/package.json').replace('/package.json', '');
const litHtmlDir = require.resolve('lit-html/package.json').replace('/package.json', '');

function createRollupConfigs({ outputDir, indexFilename, indexHTMLString }) {
  const configs = createCompatibilityConfig({
    input: 'noop',
    outputDir,
    extensions: [...DEFAULT_EXTENSIONS, 'mdx'],
    // exclude storybook-prebuilt from babel, it's already built
    // for some reason the babel exclude requires the entire file path prefix
    babelExclude: `${prebuiltDir}/**`,
    terserExclude: ['storybook-*'],
    plugins: { indexHTML: false },
  });

  function manualChunks(id) {
    // force storybook into it's own chunk so that we can skip minifying and babel it
    if (id.startsWith(prebuiltDir)) {
      return 'storybook';
    }
    // we don't want to include lit-html into the chunk with storybook, because then it will
    // not be minified
    if (id.startsWith(litHtmlDir)) {
      return 'lit-html';
    }
    return null;
  }
  configs[0].manualChunks = manualChunks;
  configs[1].manualChunks = manualChunks;

  configs[0].onwarn = onwarn;
  configs[1].onwarn = onwarn;
  configs[0].output.dir = path.join(outputDir, 'legacy');
  configs[1].output.dir = outputDir;

  configs[0].plugins.unshift(
    indexHTML({
      indexFilename,
      indexHTMLString,
      multiBuild: true,
      legacy: true,
      polyfills: {
        dynamicImport: true,
        coreJs: true,
        regeneratorRuntime: true,
        webcomponents: true,
        systemJs: true,
        fetch: true,
      },
    }),
  );

  configs[1].plugins.unshift(
    indexHTML({
      indexFilename,
      indexHTMLString,
      multiBuild: true,
      legacy: false,
      polyfills: {
        dynamicImport: true,
        coreJs: true,
        regeneratorRuntime: true,
        webcomponents: true,
        systemJs: true,
        fetch: true,
      },
    }),
  );
  return configs;
}

async function buildManager({ outputDir, assets }) {
  const configs = createRollupConfigs({
    outputDir,
    indexFilename: 'index.html',
    indexHTMLString: assets.indexHTML,
  });

  // build sequentially instead of parallel because terser is multi
  // threaded and will max out CPUs.
  await rollupBuild(configs[0]);
  await rollupBuild(configs[1]);
}

async function buildPreview({
  outputDir,
  assets: { iframeHTML },
  previewImport,
  previewConfigImport,
  storiesPatterns,
  rollupConfigDecorator,
}) {
  const { html, storyFiles } = await injectStories({
    iframeHTML,
    previewImport,
    previewConfigImport,
    storiesPatterns,
    absolutePath: false,
    rootDir: process.cwd(),
  });

  const transformMdxToJs = createMdxToJsTransformer();
  let configs = createRollupConfigs({
    outputDir,
    indexFilename: 'iframe.html',
    indexHTMLString: html,
  });

  const transformMdxPlugin = {
    transform(code, id) {
      if (id.endsWith('.mdx')) {
        return transformMdxToJs(id, code);
      }
      return null;
    },
  };

  configs[0].plugins.unshift(
    transformMdxPlugin,
    injectOrderedExportsPlugin(storyFiles),
    copyCustomElementsJsonPlugin(outputDir),
  );

  configs[1].plugins.unshift(
    transformMdxPlugin,
    injectOrderedExportsPlugin(storyFiles),
    copyCustomElementsJsonPlugin(outputDir),
  );

  if (rollupConfigDecorator) {
    configs = rollupConfigDecorator(configs) || configs;
  }

  // build sequentially instead of parallel because terser is multi
  // threaded and will max out CPUs.
  await rollupBuild(configs[0]);
  await rollupBuild(configs[1]);
}
=======
const { buildManager } = require('./rollup/buildManager');
const { buildPreview } = require('./rollup/buildPreview');
>>>>>>> chore: initial implementation

module.exports = async function build({
  storybookConfigDir,
  outputDir,
  managerPath,
  previewPath,
  storiesPatterns,
  rollupConfigDecorator,
  experimentalMdDocs,
}) {
  const managerPathRelative = `/${path.relative(process.cwd(), require.resolve(managerPath))}`;
  const managerImport = toBrowserPath(managerPathRelative);

  const assets = createAssets({
    storybookConfigDir,
    managerImport,
  });

  const previewConfigPath = path.join(storybookConfigDir, 'preview.js');
  const previewConfigImport = fs.existsSync(path.join(process.cwd(), previewConfigPath))
    ? `./${toBrowserPath(previewConfigPath)}`
    : undefined;
  const relativePreviewPath = path.relative(process.cwd(), previewPath);
  const previewImport = `./${toBrowserPath(relativePreviewPath)}`;

  await fs.remove(outputDir);
  await fs.mkdirp(outputDir);

  await buildManager({ outputDir, indexHTML: assets.indexHTML });
  await buildPreview({
    outputDir,
    iframeHTML: assets.iframeHTML,
    storiesPatterns,
    previewImport,
    previewConfigImport,
    experimentalMdDocs,
    rollupConfigDecorator,
  });
};
