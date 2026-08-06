const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { renameArtifacts, selectOutputPaths, validateJiraKey } = require('./generate-report');

async function files() {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'bugwisp-report-'));
  const adfPath = path.join(root, 'adf', 'finding.json');
  const markdownPath = path.join(root, 'markdown', 'finding.md');
  await fs.promises.mkdir(path.dirname(adfPath), { recursive: true });
  await fs.promises.mkdir(path.dirname(markdownPath), { recursive: true });
  await Promise.all([
    fs.promises.writeFile(adfPath, '{}'),
    fs.promises.writeFile(markdownPath, '# finding'),
  ]);
  return { root, adfPath, markdownPath };
}

test('renameArtifacts prefixes both artifacts with a safe Jira key', async () => {
  const input = await files();
  const output = await renameArtifacts('KAN-123', input.adfPath, input.markdownPath);
  assert.match(output.adfPath, /KAN-123-finding\.json$/);
  assert.match(output.markdownPath, /KAN-123-finding\.md$/);
  assert.ok(fs.existsSync(output.adfPath));
  assert.ok(fs.existsSync(output.markdownPath));
});

test('validateJiraKey rejects path traversal', () => {
  assert.throws(() => validateJiraKey('../KAN-123'), /Unsafe Jira issue key/);
});

test('selectOutputPaths keeps Markdown-only names slug-based', async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'bugwisp-output-'));
  const previous = process.env.REPORT_OUTPUT_ROOT;
  process.env.REPORT_OUTPUT_ROOT = root;
  try {
    const output = selectOutputPaths('SQL Injection', false, true);
    assert.match(output.markdownPath, /markdown\/sql-injection\.md$/);
    assert.doesNotMatch(output.markdownPath, /KAN-/);
  } finally {
    if (previous === undefined) delete process.env.REPORT_OUTPUT_ROOT;
    else process.env.REPORT_OUTPUT_ROOT = previous;
  }
});

test('renameArtifacts preserves originals when the second rename fails', async () => {
  const input = await files();
  await fs.promises.rm(input.markdownPath);
  await assert.rejects(() => renameArtifacts('KAN-123', input.adfPath, input.markdownPath), /Failed to rename artifacts/);
  assert.ok(fs.existsSync(input.adfPath));
  assert.ok(!fs.existsSync(input.adfPath.replace('finding.json', 'KAN-123-finding.json')));
});

test('renameArtifacts refuses an existing Jira-prefixed destination', async () => {
  const input = await files();
  const target = path.join(path.dirname(input.adfPath), 'KAN-123-finding.json');
  await fs.promises.writeFile(target, 'existing');
  await assert.rejects(() => renameArtifacts('KAN-123', input.adfPath, input.markdownPath), /already exists/);
  assert.ok(fs.existsSync(input.adfPath));
  assert.ok(fs.existsSync(input.markdownPath));
});
