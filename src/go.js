const { File, print, exec } = require('./lib');
const monkeyPatch = require('./monkey-patch');

function go(options) {
  if (options.monkey) monkeyPatch();
  const pathsData = readPathsData(options);
  const staticCtx = makeStaticCtx(pathsData);
  const staticKeys = Object.keys(staticCtx);
  const staticValues = Object.values(staticCtx);
  if (options.loop) {
    const state = new State(options, pathsData);
    const fMaker = makeLoopFunction(options, staticKeys, state.initCtx());
    const f = fMaker(...staticValues);
    const gen = f();
    gen.next();   //step to first yield
    if (options.loop) {
      for (const ctx of state.ctx()) {
	gen.next(ctx);
      }
    }
  }
  else {
    const fMaker = makeNoLoopFunction(options, staticKeys)
    const f = fMaker(...staticValues);
    f();
  }
}

const GLOBAL_FILES = '$files';

function readPathsData(options) {
  const paths = [];
  const data = [];
  const xpaths = options.xpaths;
  globalThis[GLOBAL_FILES] = [];  
  for (const [i, xpath] of xpaths.entries()) {
    const { path, ext, split } = xpath;
    paths.push(path);
    data.push(File.read(path, { ext, split }));
  }
  return { paths, data };
}

module.exports = go;

class State {
  constructor(options, pathsData) {
    this.options = options;
    Object.assign(this, pathsData);
    this.sep = State.fieldSeparator(options);
  }

  initCtx() {
    return (
      { _: undefined,        //current "line"
	_n: undefined,       //current line number (1-origin)
	_path: undefined,    //current path being processed
	_d: undefined,       //contents of current path
	_isDone: false,      //generator control
      }
    );
  }

  static fieldSeparator(options) {
    const fieldSep = options.fieldSep;
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
    const { paths, data, sep } = this;
    for (let i = 0; i < data.length; ++i) {
      if (data[i] instanceof Array) {
	let _n = 1;
	const _d = data[i];
	const _path = paths[i];
	for (const line of _d) {
	  const splits = line.split && line.split(sep);
	  if (splits) {
	    for (const [i, v] of splits.entries()) {
	      globalThis[`_${i}`] = v;
	    }
	  }
	  yield { _: line,  _n, _d, _path, _isDone: false, };
	  if (splits) {
	    for (const [i, _] of splits.entries()) {
	      globalThis[`_${i}`] = undefined;
	    }
	  }
	  _n++;
	} //for (const line ...)
      } //if (data[i] instanceof Array)
    }
    yield Object.assign({}, this.initCtx(), { _isDone: true });
  }
}

function makeLoopFunction(options, staticKeys, ctx) {
  const ctxKeys = Object.keys(ctx).join(', ');
  const isPrint = options.print;
  const segs = segments(options);
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
  return new Function(...staticKeys, body);
}

  
function makeNoLoopFunction(options, staticKeys) {
  const segs = segments(options);
  const body = `
    return function() {
      ${segs.body}
    }  
  `;
  return new Function(...staticKeys, body);
}

function segments(options) {
  const segs = { begin: '', body: '', end: '' };
  (options.eval ?? []).forEach(blk => {
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

function makeStaticCtx(pathsData) {
  const _pathsData = { _paths: pathsData.paths, _data: pathsData.data };
  return Object.assign({}, BASE_STATIC_CTX, _pathsData);
}
						  
const BASE_STATIC_CTX = {
  _r: File.read,
  _d: File.dir,
  _p: print,
  _x: exec,
  $: exec,
};

