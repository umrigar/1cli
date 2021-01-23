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
		       
