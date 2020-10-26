const { Option, Options } = require('./options');

const  Path = require('path');
const fs = require('fs');

const OPTIONS = {
  eval: new Option({
    shortOpt: 'e',
    longOpt: 'eval',
    doc: `eval SCRIPT; script starting with BEGIN/END only eval'd once`,
    isMultiple: true,
    arg: 'SCRIPT',
  }),
  fieldSep: new Option({
    shortOpt: 'f',
    longOpt: 'field-separator',
    doc: 'field separator splits line _ into _0, _1, ... with -n or -p',
    arg: 'FIELD-SEPARATOR',
  }),
  noPrintLoop: new Option({
    shortOpt: 'n',
    longOpt: 'no-print',
    doc:  'repeatedly eval non-BEGIN/END SCRIPT for each _',
    type: 'boolean',
  }),
  printLoop: new Option({
    shortOpt: 'p',
    longOpt: 'print',
    doc: 'print _ after each repeat of eval non-BEGIN/END SCRIPT for each _',
    type: 'boolean',
  }),
};


const options = new Options(OPTIONS);
console.log(options.options, options.nonOptions);
process.exit(1);


class CliArgs {

  constructor() {
    const argv = process.argv;
    if (argv.length <= 2) CliArgs.usage();
    const [opts, restArgs] = CliArgs.options(argv.slice(2));
    this.opts = opts; this.fileSpecs = restArgs;
  }

  static options(args) {
    const opts = {isLoop: false, isPrint: false, blks: []};
    const nArgs = args.length;
    let i = 0;
    loop:
    for (i = 0; i < nArgs; i++) {
      const arg = args[i];
      if (!arg.startsWith('-')) break;
      switch (arg.substring(1)) {
	case 'e': {
	  if (i === nArgs - 1) {
	    console.error('-e requires an additional CODE argument');
	    CliArgs.usage();
	  }
	  opts.blks.push(args[++i]);
	  break;
	}
	case 'n': {
	  opts.isLoop = true; opts.isPrint = false;
	  break;
	}
	case 'p': {
	  opts.isLoop = true; opts.isPrint = true;
	  break;
	}
	case '-':
	  i++;
	  break loop;
	default:
	  console.error(`invalid option ${arg}`);
	  CliArgs.usage();
	  break;
      }
    } //for (let i = 0; i < nArgs; i++)
    return [opts, args.slice(i)];
  }

  static usage() {
    const prg = Path.basename(process.argv[1]);
    const msg = `usage: ${prg} [-n] [-p] [-e CODE] FILE...`;
    console.error(msg);
    process.exit(1);
  }

}

module.exports = CliArgs;
