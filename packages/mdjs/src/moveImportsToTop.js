const { parse } = require('es-module-lexer');

/**
 * @param {string} code
 * @param {string} replacement
 * @param {number} start
 * @param {number} end
 * @return {string} String with replaced content
 */
function replaceCode(code = '', replacement, start, end) {
  const before = code.substring(0, start);
  const after = code.substring(end);
  return `${before}${replacement}${after}`;
}

/**
 * @param {string} code
 */
async function moveImportsToTop(code) {
  const [imports] = await parse(code);

  console.log(imports);

  return code;
}

module.exports = {
  moveImportsToTop,
};
