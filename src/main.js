const go = require('./go');
const Options = require('./options');

function main(argv=process.argv) {
  const options = new Options();
  if (argv.length < 3) options.help();
  const cliArgs = options.parse();
  go(cliArgs);
}

module.exports = main;



