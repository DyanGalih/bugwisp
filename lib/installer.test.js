const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { installSkill, installBundle } = require('./installer');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bugwisp-installer-'));
  const prompt = path.join(root, 'bug-report-prompt.md');
  fs.writeFileSync(prompt, '# prompt');
  return { root, prompt };
}

test('installs a supported target inside the requested root', () => {
  const { root, prompt } = fixture();
  const destination = installSkill('agent', prompt, root);
  assert.equal(destination, path.join(root, '.agent', 'skills', 'bug-report-prompt', 'SKILL.md'));
  assert.match(fs.readFileSync(destination, 'utf8'), /# prompt/);
});

test('rejects unsupported selections without writing', () => {
  const { root, prompt } = fixture();
  assert.throws(() => installSkill('../escape', prompt, root), /Unsupported agent type/);
  assert.deepEqual(fs.readdirSync(root), ['bug-report-prompt.md']);
});

test('rejects collisions instead of overwriting', () => {
  const { root, prompt } = fixture();
  const destination = installSkill('opencode', prompt, root);
  assert.throws(() => installSkill('opencode', prompt, root), /already exists/);
  assert.equal(fs.readFileSync(destination, 'utf8'), '# prompt');
});

test('installs all selected agents, generator skill, and public templates', () => {
  const { root, prompt } = fixture();
  const generator = path.join(__dirname, '..', 'prompts', 'markdown-generator.md');
  const installed = installBundle(['agent', 'cursor', 'opencode'], [prompt, generator], root);
  assert.equal(installed.length, 9);
  assert.ok(fs.existsSync(path.join(root, '.agent', 'skills', 'bug-report-prompt', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(root, '.cursor', 'skills', 'markdown-generator', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(root, '.opencode', 'commands', 'markdown-generator.md')));
  assert.ok(fs.existsSync(path.join(root, '.bugwisp', 'templates', 'markdown', 'bug-template.md')));
  assert.ok(fs.existsSync(path.join(root, '.bugwisp', 'templates', 'adf', 'bug-template.json')));
});

test('rolls back every target when a later copy fails', () => {
  const { root, prompt } = fixture();
  const missing = path.join(root, 'missing.md');
  assert.throws(() => installBundle(['agent', 'opencode'], [prompt, missing], root), /all partial output was rolled back/);
  assert.equal(fs.existsSync(path.join(root, '.agent')), false);
  assert.equal(fs.existsSync(path.join(root, '.opencode')), false);
  assert.equal(fs.existsSync(path.join(root, '.bugwisp')), false);
});
