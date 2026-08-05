const fs = require('fs');
const path = require('path');
const { slug } = require('./slug');

function readPrompt(promptPath) {
    return fs.readFileSync(promptPath, 'utf8');
}

// Full agent config from spec-kit CommandRegistrar.AGENT_CONFIGS
const AGENT_CONFIGS = {
    // Markdown command dirs (flat .md files)
    opencode:     { dir: '.opencode/commands',   ext: '.md' },
    junie:        { dir: '.junie/commands',      ext: '.md' },
    amp:          { dir: '.amp/commands',        ext: '.md' },
    auggie:       { dir: '.augment/commands',    ext: '.md' },
    bob:          { dir: '.bob/commands',        ext: '.md' },
    codebuddy:    { dir: '.codebuddy/commands',  ext: '.md' },
    'cursor-agent': { dir: '.cursor/skills',     ext: '.md' },
    firebender:   { dir: '.firebender/commands', ext: '.md' },
    forge:        { dir: '.forge/commands',      ext: '.md' },
    kilocode:     { dir: '.kilocode/workflows',  ext: '.md' },
    'kiro-cli':   { dir: '.kiro/commands',       ext: '.md' },
    omp:          { dir: '.omp/commands',        ext: '.md' },
    pi:           { dir: '.pi/commands',         ext: '.md' },
    qodercli:     { dir: '.qoder/commands',      ext: '.md' },
    qwen:         { dir: '.qwen/commands',       ext: '.md' },
    shai:         { dir: '.shai/commands',       ext: '.md' },
    vibe:         { dir: '.vibe/commands',       ext: '.md' },
    cline:        { dir: '.clinerules/workflows', ext: '.md' },

    // SKILL.md agents (subdirectory with SKILL.md)
    claude:       { dir: '.claude/skills',       ext: '/SKILL.md' },
    codex:        { dir: '.agents/skills',       ext: '/SKILL.md' },
    zed:          { dir: '.agents/skills',       ext: '/SKILL.md' },
    agy:          { dir: '.agents/skills',       ext: '/SKILL.md' },
    devin:        { dir: '.devin/skills',        ext: '/SKILL.md' },
    grok:         { dir: '.grok/skills',         ext: '/SKILL.md' },
    trae:         { dir: '.trae/skills',         ext: '/SKILL.md' },
    kimi:         { dir: '.kimi-code/skills',    ext: '/SKILL.md' },
    lingma:       { dir: '.lingma/skills',       ext: '/SKILL.md' },
    zcode:        { dir: '.zcode/skills',        ext: '/SKILL.md' },
    rovodev:      { dir: '.rovodev/skills',      ext: '/SKILL.md' },
    hermes:       { dir: '.hermes/skills',       ext: '/SKILL.md' },

    // Copilot has both prompts dir and skills dir
    copilot:      { dir: '.github/skills',       ext: '/SKILL.md' },

    // TOML format agents
    gemini:       { dir: '.gemini/commands',     ext: '.toml' },
    tabnine:      { dir: '.tabnine/agent/commands', ext: '.toml' },

    // YAML format agent
    goose:        { dir: '.goose/recipes',       ext: '.yaml' },
};

function installMarkdown(sk, content, cmdDir) {
    const dest = path.join(process.cwd(), cmdDir, `${sk}.md`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
}

function installSkillMd(sk, content, cmdDir) {
    const dest = path.join(process.cwd(), cmdDir, `${sk}`, 'SKILL.md');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const frontmatter = `---
name: ${sk}
description: ${sk}
compatibility:
  - ${Object.keys(AGENT_CONFIGS).join(', ')}
metadata:
  author: BugWisp
  source: https://github.com/DyanGalih/bugwisp
---

${content.trim()}`;
    fs.writeFileSync(dest, frontmatter);
}

function installToml(sk, content, cmdDir) {
    const dest = path.join(process.cwd(), cmdDir, `${sk}.toml`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const toml = `description = "${sk} skill"

prompt = """
${content.trim()}
"""
`;
    fs.writeFileSync(dest, toml);
}

function installYaml(sk, content, cmdDir) {
    const dest = path.join(process.cwd(), cmdDir, `${sk}.yaml`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const yaml = `version: "1.0"
title: "${sk}"
description: "${sk} skill"
prompt: |2
  ${content.trim().replace(/\n/g, '\n  ')}
`;
    fs.writeFileSync(dest, yaml);
}

function installSkill(agentType, promptPath) {
    const cfg = AGENT_CONFIGS[agentType];
    if (!cfg) throw new Error(`Unsupported agent type: ${agentType}`);

    const content = readPrompt(promptPath);
    const sk = slug(path.basename(promptPath, '.md'));

    if (cfg.ext === '.md') {
        installMarkdown(sk, content, cfg.dir);
    } else if (cfg.ext === '/SKILL.md') {
        installSkillMd(sk, content, cfg.dir);
    } else if (cfg.ext === '.toml') {
        installToml(sk, content, cfg.dir);
    } else if (cfg.ext === '.yaml') {
        installYaml(sk, content, cfg.dir);
    }
}

module.exports = { installSkill, AGENT_CONFIGS };
