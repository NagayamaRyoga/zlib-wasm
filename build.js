const cli = require('webassembly/cli/util');
const mkdirp = require('mkdirp');

const srcDir = `${__dirname}/src`;
const buildDir = `${__dirname}/build`;

// CFLAGS
const cflags = [
  '-O3',
  '--target=wasm32-unknown-unknown',
  '-D', 'WEBASSEMBLY',
  '-emit-llvm',
  '-nostdinc',
  '-nostdlib',
  '-fno-builtin',
  '-isystem', `${cli.basedir}/include`,
  '-isystem', `${cli.basedir}/lib/musl-wasm32/include`,
  '-isystem', `${srcDir}/include`,
  '-I', `${srcDir}/zlib`,
];

// clang
async function clang(input, output, cflags, cwd) {
  await cli.run(`${cli.bindir}/clang`, [
    input,
    '-o', output,
    '-c',
    ...cflags,
  ], { cwd });
}

// llvm-link
async function link(input, output, linkflags, cwd) {
  await cli.run(`${cli.bindir}/llvm-link`, [
    input,
    '-o', output,
    ...linkflags,
  ], { cwd });
}

// llc
async function llc(input, output, llcflags, cwd) {
  await cli.run(`${cli.bindir}/llc`, [
    input,
    '-o', output,
    ...llcflags,
  ], { cwd });
}

// s2wasm
async function s2wasm(input, output, s2wasmflags, cwd) {
  await cli.run(`${cli.bindir}/s2wasm`, [
    input,
    '-o', output,
    ...s2wasmflags,
  ], { cwd });
}

// wasm-opt
async function opt(input, output, optflags, cwd) {
  await cli.run(`${cli.bindir}/wasm-opt`, [
    input,
    '-o', output,
    ...optflags,
  ], { cwd });
}

const srcs = [
  'zlib/adler32',
  'zlib/compress',
  'zlib/crc32',
  'zlib/deflate',
  'zlib/gzclose',
  'zlib/gzlib',
  'zlib/gzread',
  'zlib/gzwrite',
  'zlib/inflate',
  'zlib/infback',
  'zlib/inftrees',
  'zlib/inffast',
  'zlib/trees',
  'zlib/uncompr',
  'zlib/zutil',
];

(async () => {
  mkdirp.sync(`${buildDir}/zlib`);

  // *.c -> *.bc
  await Promise.all(
    srcs.map(src => clang(`../src/${src}.c`, `./${src}.bc`, cflags, buildDir)),
  );

  // *.c -> *.bc
  await clang(`../src/zlib-exports.c`, `./zlib-exports.bc`, cflags, buildDir);

  // *.bc -> zlib-lib.bc
  await link([
    ...srcs.map(s => `./${s}.bc`),
  ], `./zlib-lib.bc`, [
  ], buildDir);

  // zlib-exports.bc zlib-lib.bc -> zlib.bc
  await link([
    `./zlib-exports.bc`,
    `./zlib-lib.bc`,
    `${cli.basedir}/lib/webassembly.bc`,
  ], 'zlib.bc', [
    '-only-needed',
  ], buildDir);

  // zlib.bc -> zlib.s
  await llc('zlib.bc', 'zlib.s', [
    '-march=wasm32',
    '-filetype=asm',
    '-asm-verbose=false',
    '-thread-model=single',
    '-data-sections',
    '-function-sections',
  ], buildDir);

  // zlib.s -> zlib.wat
  await s2wasm('zlib.s', 'zlib.wat', [
    '--import-memory',
    '--allocate-stack', '10000',
  ], buildDir);

  // zlib.wat -> zlib.wasm
  await opt('zlib.wat', 'zlib.wasm', [
    '-O3',
    '--coalesce-locals-learning',
    '--dce',
    '--duplicate-function-elimination',
    '--inlining',
    '--local-cse',
    '--merge-blocks',
    '--optimize-instructions',
    '--reorder-functions',
    '--reorder-locals',
    '--vacuum',
  ], buildDir);
})();
