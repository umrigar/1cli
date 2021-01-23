const { execSync } = require('child_process');
const fs = require('fs');
const csvParse = require('csv-parse/lib/sync');

const CHAR_SET = 'utf8';

class File {

  static read(path, {charSet=CHAR_SET}={}, ext=true) {
    const contents = fs.readFileSync(path === '-' ? 0 : path, charSet);
    if (ext) {
      const extension = path.match(/[^\.]*$/)[0];
      const handler = EXTENSION_HANDLERS[extension];
      if (handler) return handler(contents);
    }
    return contents;
  }

  static * lines(path, {charSet='utf8', sep='\n', ext=true}={}) {
    let contents = File.read(path, charSet);
    if (contents.endsWith && contents.endsWith(sep)) {
      contents = contents.slice(0, -1);
    }
    const lines = contents.split ? contents.split(sep) : contents;
    for (const line of lines) yield line;
  }

  static json(path, charSet='utf8') {
    return JSON.parse(File.read(path, charSet));
  }

  static exists(path) { return fs.existsSync(path); }

  static dir(path) { return fs.readdirSync(path); }

}

File.r = File.read;
File.d = File.dir;

function csvOpts(delimiter=',') {
  return { delimiter,
	   columns: true,
	   skip_empty_lines: true,
	   relax_column_count: true,
	 };
}
EXTENSION_HANDLERS = {
  'json': contents => JSON.parse(contents),
  'jsonl': contents =>
    contents.split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line)),
  'csv': contents => csvParse(contents, csvOpts()),
  'tsv': contents => csvParse(contents, csvOpts('\t')),
  'psv': contents => csvParse(contents, csvOpts('|')),
};

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
};

