const commander = require('commander');

const VERSION = '0.0.1';

class Options {

  constructor() {
    const program = new commander.Command();
    const xpaths = this.xpaths = [];
    program
      .storeOptionsAsProperties(false)
      .arguments('[...path]')
      .version(VERSION, '-v, --version')
      .configureHelp({ sortOptions: true, })
      .option('-d, --debug', 'output generated functions on stderr')
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
      .option('--man', 'output manual on stdout')
      .option('-P, --print', 'print _ "line" after each loop iteration', false)
      .option('-p, --no-print', 'do not print _ "line" after each loop ' +
	      'iteration')
      .option('-X, --ext',
	      'special handling for json, jsonl, csv, psv, tsv ' +
	      'extensions in [path...]',
	      true)
      .option('-x, --no-ext', 'no special handling for extensions in [path...]')
      /*
      .option('-S, --split',
	      'split contents of [...path] into lines when applicable', true)
      .option('-s, --no-split',
	      'do not split contents of [...path] into lines')      
      */
      .option('--src <path>',
	      'like specifying <path> in [...path]; ' +
	      'always recognize --ext extensions and loop over "lines" ' +
	      'when applicable',
	      path => xpaths.push({ ext: true, loop: true, path }))
      .option('--src-no-ext <path>',
	      'like specifying <path> in [...path]; ' +
	      'loop over "lines" but do not recognize special -X extensions',
	      path => xpaths.push({ ext: false, loop: true, path }))
      .option('--src-x <path>', 'alias for --src-no-ext',
	      path => xpaths.push({ ext: false, loop: true, path }))
      .option('--src-no-loop <path>',
	      'like specifying <path> in [...path]; ' +
	      'recognize --ext extensions but do not loop over "lines"',
	      path => xpaths.push({ ext: true, loop: false, path }))
      .option('--src-l <path>', 'alias for --src-no-loop',
	      path => xpaths.push({ ext: true, loop: false, path }))
      .option('--src-no-loop-no-ext <path>',
	      'like specifying <path> in [...path] ' +
	      'arguments; ' +
	      'do not recognize special extensions; ' +
	      'do not loop over "lines"',
	      path => xpaths.push({ ext: false, loop: false, path }))
      .option('--src-lx <path>', 'alias for --src-no-ext-no-split',
	      path => xpaths.push({ ext: false, loop: false, path }))
    ;
    this.program = program;
  }

  
  parse()  {
    this.program.parse(process.argv);
    const args = this.program.args;
    const options = { ... this.program.opts() };
    const ext = options.ext;
    const split = options.split;
    args.forEach(path => this.xpaths.push({ext, path}));
    options.xpaths = this.xpaths;
    return options;
  };

  help() { this.program.help(); }
  helpInfo() { return this.program.helpInformation(); }

}

module.exports = Options;

//console.log(new Options().parse());

