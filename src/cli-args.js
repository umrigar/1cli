const  Path = require('path');
const fs = require('fs');

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
