const commander = require('commander');

const VERSION = '0.0.1';

class Options {

  constructor() {
    const program = new commander.Command();
    program
      .storeOptionsAsProperties(false)
      .arguments('[...files]')
      .version(VERSION, '-v, --version')
      .configureHelp({ sortOptions: true, })
      .option('-e, --eval <code>',
  	      'evaluate <code>. Can be specified multiple times. ' +
	      'If --loop, then evaluate for each _ "line". ' +
	      'If <code> starts with BEGIN/END then evaluate only at ' +
	      'start/end. ',
	      (code, codes) => codes.concat(code), [])
      .option('-f, --field-sep <sep>',
	      'use <sep> to split _ line into _0, _1, ... when --loop',
	      '/\\s+/')
      /*
      .option('-i, --in-place [backup-ext]',
	      `replace file(s) in-place; if backup-ext, then backup original ` +
	      `with added extension .backup-ext`)
       */
      .option('-L, --loop', 'repeat code for each _ "line"', true)
      .option('-l, --no-loop', 'run code only once')
      .option('-M, --monkey', 'monkey-patch standard classes', true)
      .option('-m, --no-monkey', 'do not monkey-patch standard classes')
      .option('-P, --print', 'print _ "line" after each loop iteration', false)
      .option('-p, --no-print', 'do not print _ "line" after each loop ' +
	      'iteration')
      .option('-X, --ext', 'recognize extensions json, jsonl, csv, psv, tsv',
	      true)
      .option('-x, --no-ext', 'no special handling for extensions');
    this.program = program;
  }

  
  parse()  {
    this.program.parse(process.argv);
    return { fileSpecs: this.program.args, options: this.program.opts(), };
  };

  help() { this.program.help(); }

}

module.exports = Options;

//console.log(new Options().parse());

