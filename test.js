const assert = require('assert');
const wasm = require('webassembly');

(async () => {
  const zlib = await wasm.load(`${__dirname}/build/zlib.wasm`, {
    imports: {
      now: Date.now,
      print: console.log,

      start_warm() { console.log('warming up'); },
      start_bench() { console.log('benchmark'); },
    },
  });

  assert.strictEqual(zlib.exports.run_test(), 0);

  zlib.exports.run_benchmark();
})();
