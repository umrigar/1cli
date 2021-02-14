const { docs: monkeyDocs } = require('./monkey-patch');
const { staticDocs, dynamicDocs } = require('./go');
const { extDocs } = require('./lib');

function man(options) {
  let text = options.helpInfo();
  text += START_DOC;
  console.log(text);
  process.exit(0);
}

module.exports = man;

const KEY_WIDTH = 12;
function docsText(docs) {
  let text = '';
  for (const key of Object.keys(docs).sort()) {
    const doc = docs[key]
      .replace(/^\s*/mg, '')
      .replace(/\n/g, `\n${''.padEnd(KEY_WIDTH + 2)}`);
    const paddedKey = `${key}:`.padEnd(KEY_WIDTH);
    text += `  ${paddedKey}${doc}\n`;
  }
  return text;
}

const START_DOC = `
Process files specified by [...path] or by --src* options
using --eval <code> blocks. 

If a path is specified as '-', then read from standard input; if an
extension is required, then attempt to guess an extension based on the
initial content.

If --loop, then repeat <code> blocks for each "line" of file contents.
A <code> block starting with 'BEGIN' is executed only once at the
start. A <code> block starting with 'END' is executed only once at the
end.

Unless extension processing has been turned off by specifying
--no-ext or by using the --src-*no-ext options, the following
special extensions are recognized:

${docsText(extDocs)}

Note that all of the above extensions except .json are read
in as an array of objects and processed within the --eval
loop blocks (unless --no-loop or --src-no-loop* is specified).

The code for each block has access to the following constants:

${docsText(staticDocs)}

When a block is being executed repeatedly because
of the --loop option, it has access to the following additional
variables:

${docsText(dynamicDocs)}

Specifying --monkey-patch, patches standard classes with
convenience methods:

${docsText(monkeyDocs)}
`;
