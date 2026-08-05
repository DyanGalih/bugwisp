const { test } = require('node:test');
const assert = require('node:assert');
const { renderFinalReport, EngagementSchema } = require('./pt-report-generator');

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
    recommendation: 'Use parameterized queries.',
    ...overrides,
  };
}

function baseEngagement(overrides = {}) {
  return {
    project_name: 'Acme Portal',
    client_name: 'Acme Corp',
    assessment_type: 'External Web Application',
    environment: 'Production',
    start_date: '2026-07-01',
    end_date: '2026-07-05',
    report_version: '1.0',
    report_date: '2026-07-10',
    classification: 'Confidential',
    in_scope: 'https://portal.acme.com',
    out_of_scope: 'Third-party CDN',
    assessment_team: 'Alice, Bob',
    methodology: 'OWASP WSTG',
    tools: ['Burp Suite', 'nmap'],
    target_inventory: ['portal.acme.com'],
    findings: [
      baseFinding(),
      baseFinding({ summary: 'Missing CSP header', cvssScore: '4.3', cvssSeverity: 'Medium', status: 'Open' }),
      baseFinding({ summary: 'Info disclosure', cvssScore: '0.0', cvssSeverity: 'Informational' }),
    ],
    ...overrides,
  };
}

test('EngagementSchema rejects an invalid finding', () => {
  const bad = baseEngagement({ findings: [baseFinding({ summary: '' })] });
  assert.throws(() => EngagementSchema.parse(bad));
});

test('EngagementSchema accepts a valid engagement', () => {
  const parsed = EngagementSchema.parse(baseEngagement());
  assert.strictEqual(parsed.findings.length, 3);
});

test('renderFinalReport populates metadata and counts', () => {
  const out = renderFinalReport(baseEngagement());
  assert.ok(out.includes('Acme Portal'));
  assert.ok(out.includes('2026-07-01 -- 2026-07-05'));
  assert.ok(out.includes('Alice, Bob'));
  const counts = out.match(/Critical\s+(\d+)[\s\S]*?High\s+(\d+)[\s\S]*?Medium\s+(\d+)[\s\S]*?Low\s+(\d+)[\s\S]*?Informational\s+(\d+)/);
  assert.ok(counts);
  assert.deepStrictEqual([counts[1], counts[2], counts[3], counts[4], counts[5]], ['1', '0', '1', '0', '1']);
});

test('renderFinalReport sorts findings by severity and assigns FIND ids', () => {
  const out = renderFinalReport(baseEngagement());
  const findIds = [...out.matchAll(/FIND-(\d\d) - /g)].map(m => m[1]);
  assert.deepStrictEqual(findIds, ['01', '02', '03']);
  assert.ok(out.indexOf('FIND-01 - SQL Injection in login') < out.indexOf('FIND-02 - Missing CSP header'));
  assert.ok(out.indexOf('FIND-02 - Missing CSP header') < out.indexOf('FIND-03 - Info disclosure'));
});

test('renderFinalReport embeds per-finding markdown body', () => {
  const out = renderFinalReport(baseEngagement());
  assert.ok(out.includes('The login form is vulnerable.'));
  assert.ok(out.includes('Use parameterized queries.'));
});

test('renderFinalReport keeps narrative placeholders when absent', () => {
  const e = baseEngagement({
    executive_summary: undefined,
    executive_recommendations: undefined,
    conclusion: undefined,
    tools: undefined,
    target_inventory: undefined,
  });
  const out = renderFinalReport(e);
  assert.ok(out.includes('{{placeholder}}'));
  assert.ok(!out.includes('{{executive_summary}}'));
});

test('renderFinalReport renders appendix tables when data present', () => {
  const out = renderFinalReport(baseEngagement());
  assert.ok(out.includes('Tool\n  ----\n  Burp Suite'));
  assert.ok(out.includes('Target\n  ----\n  portal.acme.com'));
});

test('renderFinalReport requires at least one finding', () => {
  assert.throws(() => EngagementSchema.parse(baseEngagement({ findings: [] })));
});
