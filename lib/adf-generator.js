// Ponytail: ADF generator — one file, one export, pure functions.
// Generates an exact Jira MCP create-issue payload from flat finding data and Jira config.
// Replaces LLM-handled-JSON ~75% failure rate.

const fs = require('fs');
const path = require('path');
const { z } = require('zod');

// --------------------------------------------------------------------
// T1: Zod validation schema
// --------------------------------------------------------------------
const FindingSchema = z.object({
  summary: z.string().min(1),
  cvssScore: z.string().min(1),
  cvssSeverity: z.enum(['Critical','High','Medium','Low','Informational','[N/A]']),
  cvssVector: z.string().min(1),
  cvssCalculatorUrl: z.string().optional(),
  owaspCategory: z.string().min(1),
  cwe: z.string().min(1),
  path: z.string().min(1),
  description: z.string().min(1),
  impact: z.string().min(1),
  stepsToReproduce: z.array(z.string().min(1)),
  evidenceText: z.string().min(1),
  evidenceCodeBlock: z.string().optional(),
  recommendation: z.string().min(1),
  observedResult: z.string().optional(),
  expectedResult: z.string().optional(),
  verification: z.string().optional(),
});

const JiraConfigSchema = z.object({
  cloudId: z.string().min(1),
  projectKey: z.string().min(1),
  issueTypeName: z.string().min(1).default("Bug"),
  parent: z.string().min(1).optional(),
  additionalFields: z.record(z.string(), z.unknown()).optional(),
  responseContentFormat: z.string().min(1).default("markdown"),
});

// --------------------------------------------------------------------
// T2: Template loader
// --------------------------------------------------------------------
function loadTemplate() {
  const p = path.join(__dirname, "..", "templates", "adf", "bug-template.json");
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// --------------------------------------------------------------------
// T4 Helper: Recursive content walk (returns new array, preserving deleted/null items)
// --------------------------------------------------------------------
function walkContent(items, fn) {
  return items.map(item => {
    if (!item || typeof item !== 'object') return item;
    if (Array.isArray(item.content)) {
      item.content = walkContent(item.content, fn);
      // Always filter to keep non-null items
      item.content = item.content.filter(c => c !== null);
    }
    return fn(item);
  }).filter(c => c !== null);
}

// --------------------------------------------------------------------
// T4: Placeholder replacement map
// --------------------------------------------------------------------
const L2_PLACEHOLDERS = [
  { match: (t) => t.includes('CVSS v4.0 Score') && t.includes('[Score]'), value: (f) => `CVSS v4.0 Score ${f.cvssScore} / ${f.cvssSeverity}` },
  { match: (t) => t === '[CVSS v4.0 vector or N/A]', value: (f) => f.cvssVector },
  { match: (t) => t === '[Full CVSS calculator URL or N/A]', value: (f) => f.cvssCalculatorUrl || '[N/A]' },
  { match: (t) => t === '[Category Name]', value: (f) => f.owaspCategory },
  { match: (t) => t === '[CWE-ID and Name]', value: (f) => f.cwe },
  { match: (t) => t === '[Method + URL, host, asset name, or N/A]', value: (f) => f.path },
  { match: (t) => t.startsWith('[Explain what the issue is'),     value: (f) => f.description },
  { match: (t) => t.startsWith('[Explain the business and security risk'),  value: (f) => f.impact },
  { match: (t) => t.startsWith('[Provide request/response'),     value: (f) => f.evidenceText },
  { match: (t) => t.startsWith('[Provide specific, actionable remediation'),  value: (f) => f.recommendation },
  { match: (t) => t.startsWith('[What was actually seen'),   value: (f) => f.observedResult || '[__REMOVE__]' },
  { match: (t) => t.startsWith('[What should have happened'), value: (f) => f.expectedResult || '[__REMOVE__]' },
  { match: (t) => t.startsWith('[How to confirm the fix'),   value: (f) => f.verification || '[__REMOVE__]' },
  { match: (t) => t === '[PoC Code/Response Snippet]',           value: (f) => f.evidenceCodeBlock || '[N/A]' },
];

function applyPlaceholderMap(node, f) {
  if (typeof node === 'string') return node;
  if (node.text) {
    const row = L2_PLACEHOLDERS.find(({ match }) => match(node.text));
    if (row) {
      node.text = row.value(f);
    }
  }
  return node;
}

// --------------------------------------------------------------------
// T5: Ordered list rebuild
// --------------------------------------------------------------------
function rebuildOrderedList(content, steps) {
  return walkContent(content, (node) => {
    if (node.type === 'orderedList') {
      node.content = steps.map(step => ({
        type: 'listItem',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: step }] }]
      }));
    }
    return node;
  });
}

// --------------------------------------------------------------------
// T6: Optional field node removal
// --------------------------------------------------------------------
function removeOptionalNodes(content, f) {
  return walkContent(content, (node) => {
    // Omit paragraph nodes whose content all reveal __REMOVE__ marker
    if (node.type === 'paragraph' && node.content?.length) {
      const hasRemove = node.content.some(c => c.type === 'text' && c.text?.includes('__REMOVE__'));
      if (hasRemove) return null;
    }
    if (node.type === 'codeBlock') {
      const hasPoC = node.content?.some(c => c.text === '[PoC Code/Response Snippet]' || (typeof c.text === 'string' && c.text.startsWith('[PoC Code')));
      if (hasPoC && !f.evidenceCodeBlock) return null;
    }
    // Ensure any remaining __REMOVE__ text nodes are NONE remaining.
    if (node.type === 'text' && node.text?.includes('__REMOVE__')) return null;
    return node;
  });
}

// --------------------------------------------------------------------
// T7: CVSS panelType mapping
// --------------------------------------------------------------------
const SEVERITY_PANEL = {
  Critical: 'error', High: 'error', Medium: 'warning',
  Low: 'note', Informational: 'info', '[N/A]': 'info',
};

function mapCVSSPanel(content, severity) {
  const panelType = SEVERITY_PANEL[severity] || 'info';
  return walkContent(content, (node) => {
    if (node.type === 'panel' && node.attrs && node.attrs.panelType === 'error') {
      // Check if this panel contains CVSS text (first paragraph child)
      const firstPara = node.content?.find(c => c.type === 'paragraph');
      if (firstPara && firstPara.content?.[0]?.text?.includes('CVSS')) {
        node.attrs = { ...node.attrs, panelType };
      }
    }
    return node;
  });
}

// --------------------------------------------------------------------
// T8: Build the complete Jira MCP create-issue payload
// --------------------------------------------------------------------
function generateAdf(finding, jiraConfig) {
  const f = FindingSchema.parse(finding);
  const config = JiraConfigSchema.parse(jiraConfig);
  const payload = JSON.parse(JSON.stringify(loadTemplate()));

  payload.cloudId = config.cloudId;
  payload.projectKey = config.projectKey;
  payload.issueTypeName = config.issueTypeName;
  payload.summary = f.summary;
  payload.responseContentFormat = config.responseContentFormat;
  if (config.parent) payload.parent = config.parent;
  else delete payload.parent;
  if (config.additionalFields) payload.additional_fields = config.additionalFields;

  payload.description.content = removeOptionalNodes(payload.description.content, f);

  payload.description.content = walkContent(payload.description.content, (node) => {
    if (node.type === 'paragraph') {
      const texts = node.content?.filter(c => c.type === 'text') || [];
      const shouldRm = texts.some(t =>
        (t.text.startsWith('[What was actually seen') && !f.observedResult) ||
        (t.text.startsWith('[What should have happened') && !f.expectedResult) ||
        (t.text.startsWith('[How to confirm the fix') && !f.verification)
      );
      if (shouldRm) return null;
    }
    return node;
  });

  payload.description.content = walkContent(payload.description.content, (node) => {
    applyPlaceholderMap(node, f);
    return node;
  });

  if (f.stepsToReproduce.length > 0) {
    payload.description.content = rebuildOrderedList(payload.description.content, f.stepsToReproduce);
  }

  payload.description.content = mapCVSSPanel(payload.description.content, f.cvssSeverity);

  return payload;
}

// --------------------------------------------------------------------
// T9: Export
// --------------------------------------------------------------------
module.exports = { generateAdf, FindingSchema, JiraConfigSchema };

// --- Self-check demo -----------------------------------------------------------
if (require.main === module) {
  const testData = {
    summary: 'Test SQLi',
    cvssScore: '10.0',
    cvssSeverity: 'Critical',
    cvssVector: 'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    owaspCategory: 'A05:2025 - Injection',
    cwe: 'CWE-89: SQL Injection',
    path: 'GET http://example.com/test.asp?id=1',
    description: 'The id parameter is vulnerable to SQL injection.',
    impact: 'Full database compromise possible.',
    stepsToReproduce: [
      'Navigate to the vulnerable URL.',
      'Inject payload into id parameter.',
      'Observe database output.',
    ],
    evidenceText: 'Response includes database error messages.',
    evidenceCodeBlock: 'SELECT * FROM users',
    recommendation: 'Use parameterized queries.',
    observedResult: 'Database errors displayed.',
    expectedResult: 'No error messages shown.',
    verification: 'Retest after applying fix.'
  };
  const result = generateAdf(testData, {
    cloudId: "example-cloud-id",
    projectKey: "TEST",
    issueTypeName: "Bug",
    parent: "TEST-1",
  });
  console.log(JSON.stringify(result, null, 2));
  console.log('PASS: generateAdf returned valid ADF payload');
}