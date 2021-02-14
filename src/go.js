const { File, print, exec } = require('./lib');
const { monkeyPatch } = require('./monkey-patch');

function go(options) {
  if (options.monkey) monkeyPatch();
  const pathsContents = readPathsContents(options);
  const staticCtx = makeStaticCtx(pathsContents);
  const staticKeys = Object.keys(staticCtx);
  const staticValues = Object.values(staticCtx);
  if (options.loop) {
    const state = new State(options, pathsContents);
    const fMaker = makeLoopFunction(options, staticKeys, state.initCtx(false));
    const f = fMaker(...staticValues);
    if (options.debug) process.exit(0);
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
    if (options.debug) process.exit(0);
    f();
  }
}

function readPathsContents(options) {
  const paths = [];
  const contents = [];
  const xpaths = options.xpaths;
  for (const [i, xpath] of xpaths.entries()) {
    const { path, ext, split } = xpath;
    paths.push(path);
    contents.push(File.read(path, { ext, split }));
  }
  return { paths, contents };
}

class State {
  constructor(options, pathsContents) {
    this.options = options;
    Object.assign(this, pathsContents);
    this.sep = State.fieldSeparator(options);
  }

  initCtx(isDone) {
    return (
      { ...INIT_DYNAMIC_CTX,
	_isDone: isDone,   //generator control
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
    const { paths, contents, sep } = this;
    for (let i = 0; i < contents.length; ++i) {
      if (contents[i] instanceof Array) {
	let _n = 1;
	const _c = contents[i];
	const _path = paths[i];
	for (const line of _c) {
	  const splits = line.split && line.split(sep);
	  if (splits) {
	    for (const [i, v] of splits.entries()) {
	      globalThis[`_${i}`] = v;
	    }
	  }
	  yield { _: line,  _n, _c, _path, _isDone: false, };
	  if (splits) {
	    for (const [i, _] of splits.entries()) {
	      globalThis[`_${i}`] = undefined;
	    }
	  }
	  _n++;
	} //for (const line ...)
      } //if (contents[i] instanceof Array)
    }
    yield Object.assign({}, this.initCtx(true));
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
  const fn = new Function(...staticKeys, body);
  if (options.debug) console.error(fn.toString());
  return fn;
}

  
function makeNoLoopFunction(options, staticKeys) {
  const segs = segments(options);
  const body = `
    return function() {
      ${segs.body}
    }  
  `;
  const fn = new Function(...staticKeys, body);
  if (options.debug) console.error(fn.toString());
  return fn;
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

function makeStaticCtx(pathsContents) {
  const _pathsContents = {
    _paths: pathsContents.paths,
    _contents: pathsContents.contents
  };
  const baseFnPairs =
    Object.entries(BASE_STATIC_CTX_INFOS).map(([k, v]) => [k, v.fn]);
  const baseFns = Object.fromEntries(baseFnPairs);
  return Object.assign({}, baseFns, _pathsContents);
}

function docs(infos) {
  return Object.fromEntries(Object.keys(infos).map(k => [k, infos[k].doc]));
}

const BASE_DYNAMIC_CTX_INFOS = {
  _: {
    doc: 'current "line" being processed',
  },
  _n: {
    doc: 'current line number (1-origin)',
  },
  _path: {
    doc: 'current path being processed',
  },
  _c: {
    doc: 'contents of current path',
  },
};
const INIT_DYNAMIC_CTX = initDynamicCtx(BASE_DYNAMIC_CTX_INFOS);
function initDynamicCtx(baseCtxInfo) {
  return Object.fromEntries(Object.keys(baseCtxInfo).map(k => [k, undefined]));
}

      
						  
const BASE_STATIC_CTX_INFOS = {
  _contents: {
    fn: 'no function: value populated when static ctx is built',
    doc: 'array of contents of all files specified by <path...> or --src',
  },
  _entries: {
    fn: o => Object.entries(o),
    doc: '_entries(obj) => Object.entries(obj)',
  },  
  _f: {
    fn: File.read,
    doc: '_f(path): returns array of "lines" from path',
  },
  _d: {
    fn: File.dir,
    doc: '_d(path): return array of contents of directory dir',
  },
  _j: {
    fn: arg => (typeof arg === 'string') ? JSON.parse(arg)
      : JSON.stringify(arg),
    doc: '_j(arg) => convert arg to/from JSON',
  },
  _keys: {
    fn: o => Object.keys(o),
    doc: '_keys(obj) => Object.keys(obj)',
  },
  _p: {
    fn: print,
    doc: '_p(...) is an alias for console.log(...)',
  },
  _paths: {
    fn: 'no function: value populated when static ctx is built',
    doc: 'array of paths of all files specified by <path...> or --src',
  },
  _values: {
    fn: o => Object.values(o),
    doc: '_values(obj) => Object.values(obj)',
  },
  _x: {
    fn: exec,
    doc: '_x(cmd) returns stdout for executing shell command cmd',
  },
  
};


module.exports = {
  go,
  staticDocs: docs(BASE_STATIC_CTX_INFOS),
  dynamicDocs: docs(BASE_DYNAMIC_CTX_INFOS),
};

