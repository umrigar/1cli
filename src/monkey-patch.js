const MONKEY_PATCHES = [
  { name: 'm',
    class: String,
    fn: match,
    doc: `str.m(...) => str.match(...); results[0, 1]...] put into $0, $1...`,
  },
  { name: 'r',
    class: String,
    fn: replace,
    doc: `str.r(...) => str.replace(...)`,
  },
  { name: 's',
    class: String,
    fn: split,
    doc: `str.s(...) => str.split(...)`
  },
];


module.exports = function monkeyPatch() {
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
		       
