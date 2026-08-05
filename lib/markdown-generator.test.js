const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { renderMarkdown } = require('./markdown-generator');

const TEMPLATE = path.join(__dirname, '..', 'templates', 'markdown', 'bug-template.md');

function baseFinding(overrides = {}) {
  return {
    summary: 'SQL Injection in login',
    cvssScore: '9.8',
    cvssSeverity: 'Critical',
    cvssVector: 'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    cvssCalculatorUrl: 'https://cvss.example.com/calc',
    owaspCategory: 'A03 - Injection',
    cwe: 'CWE-89: SQL Injection',
    path: 'POST https://app.example.com/login',
    description: 'The login form is vulnerable.',
    impact: 'Full database compromise.',
    stepsToReproduce: ['Open the login page.', 'Inject payload.'],
    evidenceText: 'Server returned a stack trace.',
    evidenceCodeBlock: 'Error: syntax error at line 1',
    recommendation: 'Use parameterized queries.',
    observedResult: 'Error details exposed.',
    expectedResult: 'Generic error shown.',
    verification: 'Retest after fix.',
    ...overrides,
  };
}

test('renderMarkdown fills placeholders with finding data', () => {
  const out = renderMarkdown(baseFinding(), TEMPLATE);
  assert.ok(out.includes('# SQL Injection in login'));
  assert.ok(out.includes('**CVSS Score 9.8 / Critical**'));
  assert.ok(out.includes('AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H'));
  assert.ok(out.includes('https://cvss.example.com/calc'));
  assert.ok(out.includes('**OWASP Category:** A03 - Injection'));
  assert.ok(out.includes('**CWE:** CWE-89: SQL Injection'));
  assert.ok(out.includes('POST https://app.example.com/login'));
  assert.ok(out.includes('The login form is vulnerable.'));
  assert.ok(out.includes('Full database compromise.'));
  assert.ok(out.includes('Use parameterized queries.'));
  assert.ok(out.includes('**Observed Result:** Error details exposed.'));
});

test('renderMarkdown renders numbered steps from stepsToReproduce', () => {
  const out = renderMarkdown(baseFinding(), TEMPLATE);
  assert.ok(out.includes('1. Open the login page.\n2. Inject payload.'));
});

test('renderMarkdown appends evidence code block', () => {
  const out = renderMarkdown(baseFinding(), TEMPLATE);
  assert.ok(out.includes('```text\nError: syntax error at line 1\n```'));
});

test('renderMarkdown falls back to [N/A] for missing optional fields', () => {
  const finding = baseFinding({ cvssCalculatorUrl: undefined, observedResult: undefined });
  const out = renderMarkdown(finding, TEMPLATE);
  assert.ok(out.includes('**CVSS Calculator URL:** [N/A]'));
  assert.ok(out.includes('**Observed Result:** [N/A]'));
});
