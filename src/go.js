const { File, print } = require('./lib.js');

function go(cliArgs) {
  const state = new State(cliArgs);
  const f = makeFunction(cliArgs,
			 state.initCtx())(...Object.values(STATIC_CTX));
  const gen = f();
  gen.next();   //step to first yield
  for (const ctx of state.ctx()) {
    gen.next(ctx);
  }
}

module.exports = go;

class State {
  constructor(cliArgs) {
    this.cliArgs = cliArgs;
  }

  initCtx() {
    return (
      { _: undefined,
	_isDone: !this.cliArgs.options.isLoop,
	args: this.cliArgs.fileSpecs,
      }
    );
  }

  fieldSeparator() {
    const fieldSep = this.cliArgs.options.fieldSep;
    if (fieldSep) {
      if (fieldSep.startsWith('/') && fieldSep.endsWith('/')) {
	return new RegExp(fieldSep.slice(1, -1));
      }
      else {
	return fieldSep;
      }
    }
    else {
      return null;
    }
  }

  * ctx() {
    const args = [... this.cliArgs.fileSpecs ];
    const sep = this.fieldSeparator();
    while (args.length > 0) {
      const arg = args.shift();
      for (const line of File.lines(arg)) {
	if (sep) {
	  for (const [i, v] of line.split(sep).entries()) {
	    globalThis[`_${i}`] = v;
	  }
	}
	yield { _: line, _isDone: false, args };	
      }
    }
    yield { _: undefined, _isDone: true, args, };
  }
}

class Context {
  constructor(cliArgs) {
    this._isDone = !cliArgs.options.isLoop;
    this._args = cliArgs.fileSpecs;
    this._ = null;
  }
}

function makeFunction(cliArgs, ctx) {
  const staticKeys = Object.keys(STATIC_CTX).join(', ');
  const ctxKeys = Object.keys(ctx).join(', ');
  const isPrint = cliArgs.options.isPrint;
  const segs = segments(cliArgs);
  const body = `
    return function*() {
      let ${ctxKeys};
      ${segs.begin}
      while (true) {
        ({ ${ctxKeys} } = yield);
        if (_isDone) break;
        ${segs.body}
        if (${isPrint}) _p(_);
      }
      ${segs.end}
    }
  `;
  return new Function(...Object.keys(STATIC_CTX), body);
}

function segments(cliArgs) {
  const segs = { begin: '', body: '', end: '' };
  (cliArgs.options.blks ?? []).forEach(blk => {
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
  _r: File.read,
  _p: print,
};

const DYNAMIC_CTX = {
  _: ctx => nextLine(ctx),
  _isDone: ctx => false,
  
};


