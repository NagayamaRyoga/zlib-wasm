const assert = require('assert');
const wasm = require('webassembly');

(async () => {
  const zlib = await wasm.load(`${__dirname}/build/zlib.wasm`, {
    imports: {
      print: console.log,
    },
  });

  assert.strictEqual(zlib.exports.run_test(), 0);
})();
