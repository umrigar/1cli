const go = require('./go');
const {Option, Options} = require('./options');

async function main(argv=process.argv) {
  const options = new Options(OPTIONS);
  if (argv.length < 3) usage(options);
  const args = argv.slice(2);
  const errors = [];
  const fileSpecs = options.addOptionArgs(args, errors);
  if (errors.length > 0 || options.options.help)  usage(options, errors);
  if (checkOptions(options)) {
    const cliArgs = new CliArgs(options, fileSpecs);
    go(cliArgs);
  }
}

module.exports = main;

function  usage(options, errors=[]) {
  let text = '';
  for (const err of options.errors) { text += err + "\n"; }
  const prog = Path.basename(process.argv[1]);
  text += `usage: ${prog} [ OPTION... ] [NON-OPTION-ARG...]\n`;
  text += `where OPTION is\n`;
  text += options.helpText();
  console.error(text);
  process.exit(1);
}

function checkOptions(options) {
  if (options.options.noPrintLoop && options.options.printLoop) {
    console.error(`cannot specify both ${OPTIONS.noPrintLoop} and ` +
		  `${OPTIONS.printLoop}`);
    return false;
  }
  return true;
}

class CliArgs {
  constructor(options, fileSpecs) {
    this.fileSpecs = fileSpecs;
    this.options = Object.assign({}, options.options);
    if (this.options.noPrintLoop) {
      this.options.isLoop = true; this.options.isPrint = false;
    }
    if (this.options.printLoop) {
      this.options.isLoop = true; this.options.isPrint = true;
    }
    if (!this.options.monkeyNo) {
      monkeyPatch();
    }
  }
}

const MONKEY_PATCHES = [
  { name: 'm',
    class: String,
    fn: match,
  },
  { name: 'r',
    class: String,
    fn: replace,
  },
  { name: 's',
    class: String,
    fn: split,
  },
];
function monkeyPatch() {
  for (const spec of MONKEY_PATCHES) {
    if (spec.class.prototype[spec.name]) {
      console.error(`${spec.class}.prototype.${spec.name} already exists`);
    }
    else {
      spec.class.prototype[spec.name] = spec.fn;
    }
  }
}

function replace(...args) {
  return this.replace(...args);
}
function split(...args) {
  return this.split(...args);
}

function match(...args) {
  const m = this.match(...args);
  for (const k in m) { globalThis[`$${k}`] = m[k]; }
  return m;
}
		       
const OPTIONS = {
  blks: new Option({
    shortOpt: 'e',
    longOpt: 'eval',
    doc: `eval SCRIPT; script starting with BEGIN/END only eval'd once`,
    isMultiple: true,
    arg: 'SCRIPT',
  }),
  fieldSep: new Option({
    shortOpt: 'F',
    longOpt: 'field-separator',
    doc: 'field separator splits line _ into _0, _1, ... with -n or -p',
    arg: 'FIELD-SEPARATOR',
  }),
  help: new Option({
    shortOpt: 'h',
    longOpt: 'help',
    doc: 'print this help message',
  }),
  monkeyNo: new Option({
    shortOpt: 'm',
    longOpt: 'monkey-no',
    doc:  'do not monkey-patch standard classes _',
  }),
  noPrintLoop: new Option({
    shortOpt: 'n',
    longOpt: 'no-print',
    doc:  'repeatedly eval non-BEGIN/END SCRIPTs for each _',
  }),
  printLoop: new Option({
    shortOpt: 'p',
    longOpt: 'print',
    doc: 'print _ after each repeat of eval non-BEGIN/END SCRIPTs',
  }),
};

