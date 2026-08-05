const { test } = require('node:test');
const assert = require('node:assert');
const { generateAdf } = require('./adf-generator');
const { slug } = require('./slug');

function baseFinding(overrides = {}) {
  return {
    summary: 'SQL Injection in login',
    cvssScore: '9.8',
    cvssSeverity: 'Critical',
    cvssVector: 'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    owaspCategory: 'A03 - Injection',
    cwe: 'CWE-89: SQL Injection',
    path: 'POST https://app.example.com/login',
    description: 'The login form is vulnerable.',
    impact: 'Full database compromise.',
    stepsToReproduce: ['Open the login page.', 'Inject payload into password.', 'Observe error.'],
    evidenceText: 'Server returned a stack trace.',
    evidenceCodeBlock: 'Error: syntax error at line 1',
    recommendation: 'Use parameterized queries.',
    observedResult: 'Error details exposed.',
    expectedResult: 'Generic error shown.',
    verification: 'Retest after fix.',
    ...overrides,
  };
}

function allText(node, out = []) {
  if (Array.isArray(node)) {
    node.forEach((n) => allText(n, out));
  } else if (node && typeof node === 'object') {
    if (node.type === 'text' && node.text) out.push(node.text);
    if (Array.isArray(node.content)) allText(node.content, out);
  }
  return out;
}

const config = {
  cloudId: 'cloud-123',
  projectKey: 'TEST',
  issueTypeName: 'Bug',
  parent: 'TEST-1',
  responseContentFormat: 'markdown',
};

test('generateAdf builds the expected payload shape', () => {
  const payload = generateAdf(baseFinding(), config);
  assert.strictEqual(payload.cloudId, 'cloud-123');
  assert.strictEqual(payload.projectKey, 'TEST');
  assert.strictEqual(payload.issueTypeName, 'Bug');
  assert.strictEqual(payload.summary, 'SQL Injection in login');
  assert.strictEqual(payload.parent, 'TEST-1');
  assert.strictEqual(payload.responseContentFormat, 'markdown');
  assert.strictEqual(payload.description.type, 'doc');
});

test('generateAdf fills placeholders with finding data', () => {
  const payload = generateAdf(baseFinding(), config);
  const text = allText(payload.description.content);
  assert.ok(text.includes('CVSS v4.0 Score 9.8 / Critical'));
  assert.ok(text.includes('AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H'));
  assert.ok(text.includes('A03 - Injection'));
  assert.ok(text.includes('CWE-89: SQL Injection'));
  assert.ok(text.includes('POST https://app.example.com/login'));
  assert.ok(text.includes('The login form is vulnerable.'));
  assert.ok(text.includes('Full database compromise.'));
  assert.ok(text.includes('Server returned a stack trace.'));
  assert.ok(text.includes('Use parameterized queries.'));
});

test('generateAdf rebuilds ordered list from stepsToReproduce', () => {
  const payload = generateAdf(baseFinding(), config);
  const list = payload.description.content.find((n) => n.type === 'orderedList');
  assert.ok(list, 'orderedList exists');
  const steps = list.content.map((li) => li.content[0].content[0].text);
  assert.deepStrictEqual(steps, ['Open the login page.', 'Inject payload into password.', 'Observe error.']);
});

test('generateAdf maps CVSS panel by severity', () => {
  const cases = [
    ['Critical', 'error'],
    ['High', 'error'],
    ['Medium', 'warning'],
    ['Low', 'note'],
    ['Informational', 'info'],
  ];
  for (const [severity, panelType] of cases) {
    const payload = generateAdf(baseFinding({ cvssSeverity: severity }), config);
    const cvssPanel = payload.description.content.find(
      (n) => n.type === 'panel' && allText(n).some((t) => t.includes('CVSS v4.0 Score')),
    );
    assert.strictEqual(cvssPanel.attrs.panelType, panelType, `severity ${severity}`);
  }
});

test('generateAdf removes optional result/verification nodes when absent', () => {
  const finding = baseFinding({ observedResult: undefined, expectedResult: undefined, verification: undefined });
  const payload = generateAdf(finding, config);
  const text = allText(payload.description.content);
  assert.ok(!text.some((t) => t.includes('Observed Result')));
  assert.ok(!text.some((t) => t.includes('Expected Result')));
  assert.ok(!text.some((t) => t.includes('Verification')));
});

test('generateAdf removes code block when evidenceCodeBlock absent', () => {
  const finding = baseFinding({ evidenceCodeBlock: undefined });
  const payload = generateAdf(finding, config);
  assert.ok(!payload.description.content.some((n) => n.type === 'codeBlock'));
});

test('slug handles punctuation, repeated hyphens and empty', () => {
  assert.strictEqual(slug('SQL Injection / SQLi'), 'sql-injection-sqli');
  assert.strictEqual(slug('A--B__C!D'), 'a-b-c-d');
  assert.strictEqual(slug('  leading and trailing  '), 'leading-and-trailing');
  assert.strictEqual(slug('!!!'), '');
});
