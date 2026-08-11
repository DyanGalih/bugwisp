#!/usr/bin/env node
const { init } = require('./commands/init');

const command = process.argv[2];
if (command === 'init') {
  init().catch(error => { console.error(error.message); process.exitCode = 1; });
} else {
  console.log('Usage: bugwisp init');
}
