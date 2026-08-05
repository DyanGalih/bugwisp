const fs = require('fs');
const path = require('path');

const DEFAULT_TEMPLATE = path.join(__dirname, '..', 'templates', 'markdown', 'bug-template.md');

function replaceAll(text, placeholder, value) {
  return text.split(placeholder).join(value);
}

function renderMarkdown(finding, templatePath = DEFAULT_TEMPLATE) {
  let report = fs.readFileSync(templatePath, 'utf8');
  const values = [
    ['[Title / Summary]', finding.summary],
    ['[Score]', finding.cvssScore],
    ['[Severity]', finding.cvssSeverity],
    ['[CVSS v4.0 vector or N/A]', finding.cvssVector],
    ['[Full CVSS calculator URL or N/A]', finding.cvssCalculatorUrl || '[N/A]'],
    ['[Category Name]', finding.owaspCategory],
    ['[CWE-ID and Name]', finding.cwe],
    ['[Method + URL, host, asset name, or [N/A]]', finding.path],
    ['[Explain what the issue is in clear, professional language.]', finding.description],
    ['[Explain the business and security risk if exploited.]', finding.impact],
    ['[Provide request/response snippets, curl commands, screenshots, or notes proving the issue.]', finding.evidenceText],
    ['[Provide specific, actionable remediation steps.]', finding.recommendation],
    ['[What was actually seen]', finding.observedResult || '[N/A]'],
    ['[What should have happened]', finding.expectedResult || '[N/A]'],
    ['[How to confirm the fix]', finding.verification || '[N/A]'],
  ];

  for (const [placeholder, value] of values) {
    report = replaceAll(report, placeholder, value);
  }

  const steps = finding.stepsToReproduce
    .map((step, index) => `${index + 1}. ${step}`)
    .join('\n');
  report = report.replace('1. [Step 1]\n2. [Step 2]\n3. [Step 3]', steps);

  if (finding.evidenceCodeBlock) {
    report = report.replace(
      finding.evidenceText,
      `${finding.evidenceText}\n\n\`\`\`text\n${finding.evidenceCodeBlock}\n\`\`\``,
    );
  }

  return report;
}

module.exports = { renderMarkdown };
