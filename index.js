#!/usr/bin/env node
const { init } = require('./commands/init');
const { execute: scaffold } = require('./commands/scaffold');
const { execute: compile } = require('./commands/compile');

const command = process.argv[2];
if (command === 'init') {
  init().catch(error => { console.error(error.message); process.exitCode = 1; });
} else if (command === 'scaffold') {
  scaffold().catch(error => { console.error(error.message); process.exitCode = 1; });
} else if (command === 'compile') {
  compile().catch(error => { console.error(error.message); process.exitCode = 1; });
} else {
  console.log('Usage: bugwisp <command>');
  console.log('Commands:');
  console.log('  init       Install reporting skills');
  console.log('  scaffold   Generate a skeleton engagement.json in the current directory');
  console.log('  compile    Compile JSON findings and engagement.json into final reports');
}
