#!/usr/bin/env node
const { init } = require('./commands/init');

const command = process.argv[2];

if (command === 'init') {
    init();
} else {
    console.log('Usage: index.js init');
}
