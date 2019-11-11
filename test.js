const assert = require('assert');
const wasm = require('webassembly');

(async () => {
  const zlib = await wasm.load(`${__dirname}/build/zlib.wasm`);

  assert.strictEqual(zlib.exports.add2(8, 5), 13);
})();
