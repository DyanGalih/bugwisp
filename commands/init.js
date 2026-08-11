#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { MultiSelect } = require('enquirer');
const { installBundle, AGENT_CONFIGS } = require('../lib/installer');

const PROMPTS_DIR = path.join(__dirname, '../prompts');

async function init() {
  const prompts = fs.readdirSync(PROMPTS_DIR).filter(file => file.endsWith('.md'));
  if (!prompts.length) throw new Error(`No prompts found in ${PROMPTS_DIR}`);

  const agents = await new MultiSelect({
    name: 'agents',
    message: 'Select target agents to install all skills to',
    choices: Object.keys(AGENT_CONFIGS).sort(),
  }).run();

  if (!agents.length) {
    console.log('No agents selected. Exiting.');
    return [];
  }

  const installed = installBundle(
    agents,
    prompts.map(prompt => path.join(PROMPTS_DIR, prompt)),
  );
  for (const agent of agents) {
    for (const prompt of prompts) console.log(`  -> ${prompt} initialized for ${agent}`);
  }
  console.log(`Initialized ${installed.length} files.`);
  return installed;
}

module.exports = { init };
if (require.main === module) {
  init().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
