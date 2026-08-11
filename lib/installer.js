const fs = require('fs');
const path = require('path');
const { slug } = require('./slug');

const AGENT_CONFIGS = {
  opencode: { dir: '.opencode/commands', ext: '.md' },
  junie: { dir: '.junie/commands', ext: '.md' },
  amp: { dir: '.amp/commands', ext: '.md' },
  auggie: { dir: '.augment/commands', ext: '.md' },
  bob: { dir: '.bob/commands', ext: '.md' },
  codebuddy: { dir: '.codebuddy/commands', ext: '.md' },
  firebender: { dir: '.firebender/commands', ext: '.md' },
  forge: { dir: '.forge/commands', ext: '.md' },
  kilocode: { dir: '.kilocode/workflows', ext: '.md' },
  'kiro-cli': { dir: '.kiro/commands', ext: '.md' },
  omp: { dir: '.omp/commands', ext: '.md' },
  pi: { dir: '.pi/commands', ext: '.md' },
  qodercli: { dir: '.qoder/commands', ext: '.md' },
  qwen: { dir: '.qwen/commands', ext: '.md' },
  shai: { dir: '.shai/commands', ext: '.md' },
  vibe: { dir: '.vibe/commands', ext: '.md' },
  cline: { dir: '.clinerules/workflows', ext: '.md' },
  agent: { dir: '.agent/skills', ext: '/SKILL.md' },
  cursor: { dir: '.cursor/skills', ext: '/SKILL.md' },
  'cursor-agent': { dir: '.cursor/skills', ext: '.md' },
  claude: { dir: '.claude/skills', ext: '/SKILL.md' },
  codex: { dir: '.agents/skills', ext: '/SKILL.md' },
  zed: { dir: '.agents/skills', ext: '/SKILL.md' },
  agy: { dir: '.agents/skills', ext: '/SKILL.md' },
  devin: { dir: '.devin/skills', ext: '/SKILL.md' },
  grok: { dir: '.grok/skills', ext: '/SKILL.md' },
  trae: { dir: '.trae/skills', ext: '/SKILL.md' },
  'kimi-code': { dir: '.kimi-code/skills', ext: '/SKILL.md' },
  lingma: { dir: '.lingma/skills', ext: '/SKILL.md' },
  zcode: { dir: '.zcode/skills', ext: '/SKILL.md' },
  rovodev: { dir: '.rovodev/skills', ext: '/SKILL.md' },
  hermes: { dir: '.hermes/skills', ext: '/SKILL.md' },
  copilot: { dir: '.github/skills', ext: '/SKILL.md' },
  gemini: { dir: '.gemini/commands', ext: '.toml' },
  tabnine: { dir: '.tabnine/agent/commands', ext: '.toml' },
  goose: { dir: '.goose/recipes', ext: '.yaml' },
};

const PUBLIC_ASSETS = [
  ['templates/markdown/bug-template.md', '.bugwisp/templates/markdown/bug-template.md'],
  ['templates/markdown/pt-report-template.md', '.bugwisp/templates/markdown/pt-report-template.md'],
  ['templates/adf/bug-template.json', '.bugwisp/templates/adf/bug-template.json'],
];

function readPrompt(promptPath) {
  return fs.readFileSync(promptPath, 'utf8');
}

function assertInside(root, destination) {
  const relative = path.relative(root, destination);
  if (relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
    throw new Error('Refusing to write outside installation target: ' + destination);
  }
}

function atomicWrite(destination, content) {
  if (fs.existsSync(destination)) {
    throw new Error('Destination already exists: ' + destination);
  }
  const temporary = destination + '.tmp-' + process.pid;
  try {
    fs.writeFileSync(temporary, content, { encoding: 'utf8', flag: 'wx' });
    fs.renameSync(temporary, destination);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function prepareDestination(root, relative) {
  const destination = path.resolve(root, relative);
  assertInside(root, destination);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  assertInside(fs.realpathSync(root), fs.realpathSync(path.dirname(destination)));
  return destination;
}

function renderSkill(agentType, skillName, content) {
  const cfg = AGENT_CONFIGS[agentType];
  if (cfg.ext === '.md') {
    return { relative: path.join(cfg.dir, skillName + '.md'), content };
  }
  if (cfg.ext === '/SKILL.md') {
    return {
      relative: path.join(cfg.dir, skillName, 'SKILL.md'),
      content: '---\nname: ' + skillName + '\ndescription: ' + skillName +
        '\nmetadata:\n  author: BugWisp\n---\n\n' + content.trim(),
    };
  }
  if (cfg.ext === '.toml') {
    return {
      relative: path.join(cfg.dir, skillName + '.toml'),
      content: 'description = "' + skillName + ' skill"\n\nprompt = """\n' +
        content.trim() + '\n"""\n',
    };
  }
  return {
    relative: path.join(cfg.dir, skillName + '.yaml'),
    content: 'version: "1.0"\ntitle: "' + skillName +
      '"\nprompt: |2\n  ' + content.trim().replace(/\n/g, '\n  ') + '\n',
  };
}

function installSkill(agentType, promptPath, targetRoot = process.cwd()) {
  if (!AGENT_CONFIGS[agentType]) {
    throw new Error('Unsupported agent type: ' + agentType);
  }
  const root = path.resolve(targetRoot);
  const skillName = slug(path.basename(promptPath, '.md'));
  const rendered = renderSkill(agentType, skillName, readPrompt(promptPath));
  const destination = prepareDestination(root, rendered.relative);
  atomicWrite(destination, rendered.content);
  return destination;
}

function installSkills(agentType, promptPaths, targetRoot = process.cwd()) {
  return promptPaths.map(promptPath => installSkill(agentType, promptPath, targetRoot));
}

function installPublicAssets(targetRoot = process.cwd()) {
  const root = path.resolve(targetRoot);
  return PUBLIC_ASSETS.map(([sourceRelative, destinationRelative]) => {
    const source = path.join(__dirname, '..', sourceRelative);
    const destination = prepareDestination(root, destinationRelative);
    atomicWrite(destination, fs.readFileSync(source, 'utf8'));
    return destination;
  });
}

function rollback(created, targetRoot) {
  const root = path.resolve(targetRoot);
  for (const destination of created.reverse()) {
    if (fs.existsSync(destination)) fs.unlinkSync(destination);
    let directory = path.dirname(destination);
    while (directory !== root && fs.existsSync(directory) && fs.readdirSync(directory).length === 0) {
      fs.rmdirSync(directory);
      directory = path.dirname(directory);
    }
  }
}

function installBundle(agentTypes, promptPaths, targetRoot = process.cwd()) {
  const created = [];
  const written = new Set();
  try {
    const root = path.resolve(targetRoot);
    for (const agentType of agentTypes) {
      for (const promptPath of promptPaths) {
        const skillName = slug(path.basename(promptPath, '.md'));
        const rendered = renderSkill(agentType, skillName, ''); // empty content is enough for relative path
        const destination = path.resolve(root, rendered.relative);
        if (written.has(destination)) continue;
        written.add(destination);
        created.push(installSkill(agentType, promptPath, targetRoot));
      }
    }
    for (const [sourceRelative, destinationRelative] of PUBLIC_ASSETS) {
      const destination = path.resolve(root, destinationRelative);
      if (written.has(destination)) continue;
      written.add(destination);
      
      const source = path.join(__dirname, '..', sourceRelative);
      const preparedDest = prepareDestination(root, destinationRelative);
      atomicWrite(preparedDest, fs.readFileSync(source, 'utf8'));
      created.push(preparedDest);
    }
    return created;
  } catch (error) {
    rollback(created, targetRoot);
    throw new Error('Installation failed; all partial output was rolled back: ' + error.message);
  }
}

module.exports = {
  AGENT_CONFIGS,
  installSkill,
  installSkills,
  installPublicAssets,
  installBundle,
};
