const CliArgs = require('./cli-args');
const { File, print } = require('./lib.js');

async function main() {
  const args = new CliArgs();
  const state = new State(args);
  const f = makeFunction(args, state.initCtx())(...Object.values(STATIC_CTX));
  const gen = f();
  gen.next();   //step to first yield
  for (const ctx of state.ctx()) {
    gen.next(ctx);
  }
}

module.exports = main;

class State {
  constructor(cliArgs) {
    this.cliArgs = cliArgs;
  }

  initCtx() {
    return (
      { _: undefined,
	_isDone: !this.cliArgs.opts.isLoop,
	args: this.cliArgs.fileSpecs,
      }
    );
  }

  * ctx() {
    const args = [... this.cliArgs.fileSpecs ];
    while (args.length > 0) {
      const arg = args.shift();
      for (const line of File.lines(arg)) {
	yield { _: line, _isDone: false, args };	
      }
    }
    yield { _: undefined, _isDone: true, args, };
  }
}

class Context {
  constructor(cliArgs) {
    this._isDone = !cliArgs.opts.isLoop;
    this._args = cliArgs.fileSpecs;
    this._ = null;
  }
}

function makeFunction(cliArgs, ctx) {
  const staticKeys = Object.keys(STATIC_CTX).join(', ');
  const ctxKeys = Object.keys(ctx).join(', ');
  const isPrint = cliArgs.opts.isPrint;
  const segs = segments(cliArgs);
  const body = `
    return function*() {
      let ${ctxKeys};
      ${segs.begin}
      while (true) {
        ({ ${ctxKeys} } = yield);
        if (_isDone) break;
        ${segs.body}
        if (${isPrint}) p(_);
      }
      ${segs.end}
    }
  `;
  //const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  return new Function(...Object.keys(STATIC_CTX), body);
}

function segments(cliArgs) {
  const segs = { begin: '', body: '', end: '' };
  cliArgs.opts.blks.forEach(blk => {
    const m = blk.match(/\s*(BEGIN|END)?\s*:?\s*([^]*)/);
    if (m[1]) {
      segs[m[1].toLowerCase()] +=  m[2];
    }
    else {
      segs.body += m[0];
    }
  });
  return segs;
}

						  
const STATIC_CTX = {
  r: File.read,
  p: print,
};

const DYNAMIC_CTX = {
  _: ctx => nextLine(ctx),
  _isDone: ctx => false,
  
};

