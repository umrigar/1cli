const { go } = require('./go');
const man = require('./man');
const Options = require('./options');

function main(argv=process.argv) {
  const options = new Options();
  const opts = options.parse();
  if (opts.man) {
    man(options);
  }
  if (opts.xpaths.length === 0) {
    options.help();
  }
  go(opts);
}

module.exports = main;



