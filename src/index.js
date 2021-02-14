const lib = require('./lib');

function makeModule() {
  const module = { ...lib };
  delete module.extDocs;
  return module;
}

module.exports = makeModule();
  
