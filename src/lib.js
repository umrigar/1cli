const fs = require('fs');

class File {

  static read(path, charSet='utf8') {
    return fs.readFileSync(path === '-' ? 0 : path, charSet);
  }

  static * lines(path, {charSet = 'utf8', sep = '\n'}={}) {
    let contents = File.read(path, charSet);
    if (contents.endsWith(sep)) contents = contents.slice(0, -1);
    for (const line of contents.split(sep)) yield line;
  }
  
}

File.r = File.read;

function print(...args) { console.log(...args); }

module.exports = {
  File,
  print,
};

