#!/usr/bin/env node

const main = require('./src/main');

try {
  main();
}
catch (err) {
  console.error(err);
}

