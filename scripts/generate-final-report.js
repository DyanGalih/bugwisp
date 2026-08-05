#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { renderFinalReport, EngagementSchema } = require('../lib/pt-report-generator');
const { slug } = require('../lib/slug');

const sourceRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const inputIndex = argv.indexOf('--input');
  if (inputIndex === -1 || !argv[inputIndex + 1]) {
    throw new Error('Usage: generate-final-report.js --input <engagement.json>');
  }
  return { inputPath: path.resolve(argv[inputIndex + 1]) };
}

function selectOutputPath(projectName) {
  const outputRoot = process.env.REPORT_OUTPUT_ROOT
    ? path.resolve(process.env.REPORT_OUTPUT_ROOT)
    : path.join(sourceRoot, 'reporting', 'output', 'final');
  const base = slug(projectName) || 'pentest-report';
  let suffix = 0;
  while (true) {
    const stem = suffix === 0 ? base : `${base}-${suffix}`;
    const reportPath = path.join(outputRoot, `${stem}.md`);
    if (!fs.existsSync(reportPath)) return { outputRoot, reportPath };
    suffix += 1;
  }
}

async function main() {
  const { inputPath } = parseArgs(process.argv.slice(2));
  const raw = JSON.parse(await fs.promises.readFile(inputPath, 'utf8'));
  let engagement;
  try {
    engagement = EngagementSchema.parse(raw);
  } catch (e) {
    if (e?.issues) {
      const msgs = e.issues.map(i => `"${i.path.join('.')}": expected ${i.expected}, received ${i.received}`);
      throw new Error(`Engagement validation failed:\n  ${msgs.join('\n  ')}`);
    }
    throw e;
  }

  const { outputRoot, reportPath } = selectOutputPath(engagement.project_name);
  const report = renderFinalReport(engagement);

  await fs.promises.mkdir(outputRoot, { recursive: true });
  await fs.promises.writeFile(reportPath, report);

  process.stdout.write(`${JSON.stringify({ reportPath })}\n`);
}

main().catch(error => {
  process.stderr.write((error.message || String(error)) + "\n");
  process.exitCode = 1;
});
