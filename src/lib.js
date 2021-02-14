const { execSync } = require('child_process');
const fs = require('fs');
const csvParse = require('csv-parse/lib/sync');

const CHAR_SET = 'utf8';

/*
 */

class File {

  /** If options.ext, then special handling for recognized extensions
   *  If options.split, then split content into array of lines when
   *  applicable (not applicable when .json extension recognized).
   */
  static read(path, options={charSet: CHAR_SET, ext: true, split: true}) {
    const charSet = options.charSet ?? CHAR_SET;
    const { ext, split } = options;
    let ret = fs.readFileSync(path === '-' ? 0 : path, charSet);
    let { extHandler, splitHandler } = DEFAULT_EXT_INFO;
    if (ext) {
      const extension =
        (path === '-') ? contentExtension(ret) : path.match(/\.[^\.]*$/)[0];
      const info = SPECIAL_EXT_INFOS[extension];
      if (info) ( { extHandler, splitHandler, } = info );
    }
    if (extHandler) ret = extHandler(ret);
    if (split && splitHandler) ret = splitHandler(ret);
    return ret;
  }

  static * lines(path, options={charSet: CHAR_SET}) {
    let lines = File.read(path, Object.assign({}, options, { split: true}));
    if (lines instanceof Array) {
      for (const line of lines) yield line;
    }
  }

  static json(path, charSet='utf8') {
    return JSON.parse(File.read(path, charSet));
  }

  static exists(path) { return fs.existsSync(path); }

  static dir(path='.') { return fs.readdirSync(path); }

}

File.f = File.read;
File.d = File.dir;

//@TODO: join obj1, obj2 on name; try to handle useful cases.
function jsonJoin(name, obj1, obj2=undefined) {
  if (obj1 instanceof Array && obj2 instanceof Array) {
    const obj1Map = Object.fromEntries(obj1.filter(obj => obj[name] ?? true)
				     .map(obj => [obj[name], obj]));
    return obj2.filter(obj => obj[name] ?? true)
      .map(obj => {
	const val = obj[name];
	return Object.assign({ name: val }, obj1Map[val], obj);
      });
  }
}

/** Attempt to guess extension when content is taken from stdin  */
function contentExtension(content) {
  if (content.startsWith('{')) {
    return '.json';
  }
  else {
    const lines = content.split('\n');
    if (content.startsWith('[')) {
      if (lines[0].endsWith(']')) {
	return (lines.length > 1) ? '.jsonl' : '.json';
      }
      else {
	return '.json';
      }
    }
    else {
      const maxSplit = [',', '\t', '|',]
	    .map(delim => [delim, lines[0].split(delim).length])
	    .sort((a, b) => b[1] - a[1])[0];
      return (maxSplit[1] >= 2) ? DELIM_EXTS[maxSplit[0]]  : '';
    }
  }
}

const DELIM_EXTS = {
  ',': '.csv',
  '\t': '.tsv',
  '|': '.psv'
}
function csvOpts(delimiter=',') {
  return { delimiter,
	   columns: true,
	   skip_empty_lines: true,
	   relax_column_count: true,
	 };
}
const SPECIAL_EXT_INFOS = {
  '.json': {
    extHandler: contents => JSON.parse(contents),
    doc: 'parsed as JSON content; never split into lines.',
  },
  '.jsonl': {
    extHandler: contents =>
      contents.split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line)),
    doc: 'each line parsed as JSON; always split into lines',
  },
  '.csv': {
    extHandler: contents => csvParse(contents, csvOpts()),
    doc: 'parsed as comma-separated CSV with first line as header',
  },
  '.tsv': {
    extHandler: contents => csvParse(contents, csvOpts('\t')),
    doc: 'parsed as tab-separated CSV with first line as header',
  },
  '.psv': {
    extHandler: contents => csvParse(contents, csvOpts('|')),
    doc: 'parsed as pipe \'|\' separated CSV with first line as header',
  },
};
const DEFAULT_EXT_INFO = {
  splitHandler: text => text.split('\n'),
};

function docs(infos) {
  return Object.fromEntries(Object.keys(infos).map(k => [k, infos[k].doc]));
}

function print(...args) { console.log(...args); }

function exec(cmd, input=null) {
  const options =
    (input === null) ? { encoding: CHAR_SET } : { encoding: CHAR_SET, input, };
  return execSync(cmd, options);
}


module.exports = {
  File,
  print,
  exec,
  extDocs: docs(SPECIAL_EXT_INFOS),
};

