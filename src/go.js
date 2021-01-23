const { File, print, exec } = require('./lib');
const monkeyPatch = require('./monkey-patch');

function go(cliArgs) {
  if (cliArgs.options.monkey) monkeyPatch();
  if (cliArgs.options.loop) {
    const state = new State(cliArgs);
    const f = makeLoopFunction(cliArgs,
			   state.initCtx())(...Object.values(STATIC_CTX));
    const gen = f();
    gen.next();   //step to first yield
    if (cliArgs.options.loop) {
      for (const ctx of state.ctx()) {
	gen.next(ctx);
      }
    }
  }
  else {
    const f = makeNoLoopFunction(cliArgs)(...Object.values(STATIC_CTX));
    f();
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
	_n: undefined,
	_isDone: false,
	_args: this.cliArgs.fileSpecs,
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
      let _n = 1;
      for (const line of File.lines(arg)) {
	const splits = line.split && line.split(sep);
	if (splits) {
	  for (const [i, v] of splits.entries()) {
	    globalThis[`_${i}`] = v;
	  }
	}
	yield { _: line, _isDone: false, args, _n, };
	if (splits) {
	  for (const [i, _] of splits.entries()) {
	    globalThis[`_${i}`] = undefined;
	  }
	}
	_n++;
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

function makeLoopFunction(cliArgs, ctx) {
  const doLoop = !!cliArgs.options.loop;
  const ctxKeys = Object.keys(ctx).join(', ');
  const isPrint = cliArgs.options.print;
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

  
function makeNoLoopFunction(cliArgs) {
  const segs = segments(cliArgs);
  const body = `
    return function() {
      ${segs.body}
    }  
  `;
  return new Function(...Object.keys(STATIC_CTX), body);
}

function segments(cliArgs) {
  const segs = { begin: '', body: '', end: '' };
  (cliArgs.options.eval ?? []).forEach(blk => {
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
  _d: File.dir,
  _p: print,
  _x: exec,
  $: exec,
};

