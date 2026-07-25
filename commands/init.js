#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { MultiSelect } = require('enquirer');
const { installSkill, AGENT_CONFIGS } = require('../lib/installer');

const PROMPTS_DIR = path.join(__dirname, '../prompts');

async function init() {
    const prompts = fs.readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.md'));
    if (!prompts.length) {
        console.error('No prompts found in', PROMPTS_DIR);
        process.exit(1);
    }

    const agentSelect = new MultiSelect({
        name: 'agents',
        message: 'Select target agents to install all skills to',
        choices: Object.keys(AGENT_CONFIGS).sort()
    });

    const agents = await agentSelect.run();
    if (!agents.length) {
        console.log('No agents selected. Exiting.');
        return;
    }

    for (const agent of agents) {
        for (const prompt of prompts) {
            installSkill(agent, path.join(PROMPTS_DIR, prompt));
            console.log(`  → ${prompt} installed for ${agent}`);
        }
    }

    console.log('Done.');
}

module.exports = { init };

if (require.main === module) init();
