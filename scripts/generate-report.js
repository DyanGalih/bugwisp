#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { generateAdf, FindingSchema } = require('../lib/adf-generator');
const { renderMarkdown } = require('../lib/markdown-generator');
const { slug } = require('../lib/slug');

const sourceRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const inputIndex = argv.indexOf('--input');
  if (inputIndex === -1 || !argv[inputIndex + 1]) {
    throw new Error('Usage: generate-report.js --input <finding.json> [--format adf|markdown]');
  }
  const formatIndex = argv.indexOf('--format');
  const format = formatIndex === -1 ? undefined : argv[formatIndex + 1];
  if (format && !['adf', 'markdown'].includes(format)) {
    throw new Error('--format must be either adf or markdown');
  }
  return { inputPath: path.resolve(argv[inputIndex + 1]), format };
}

function loadEnv() {
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(sourceRoot, '.env'),
    path.join(sourceRoot, '..', '.env'),
  ];
  const envPath = candidates.find(candidate => fs.existsSync(candidate));
  if (!envPath) throw new Error('Missing .env configuration file');

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function resolveConfiguredPath(value, fallback) {
  if (!value) return fallback;
  if (path.isAbsolute(value)) return value;
  const fromCwd = path.resolve(process.cwd(), value);
  if (fs.existsSync(fromCwd)) return fromCwd;
  return path.resolve(sourceRoot, value);
}

function selectOutputPaths(summary, includeAdf, includeMarkdown) {
  const outputRoot = process.env.REPORT_OUTPUT_ROOT
    ? path.resolve(process.env.REPORT_OUTPUT_ROOT)
    : path.join(sourceRoot, 'reporting', 'output');
  const adfDir = path.join(outputRoot, 'adf');
  const markdownDir = path.join(outputRoot, 'markdown');
  const base = slug(summary) || 'security-finding';
  let suffix = 0;

  while (true) {
    const stem = suffix === 0 ? base : `${base}-${suffix}`;
    const adfPath = path.join(adfDir, `${stem}.json`);
    const markdownPath = path.join(markdownDir, `${stem}.md`);
    const adfAvailable = !includeAdf || !fs.existsSync(adfPath);
    const markdownAvailable = !includeMarkdown || !fs.existsSync(markdownPath);
    if (adfAvailable && markdownAvailable) {
      return { adfDir, markdownDir, adfPath, markdownPath };
    }
    suffix += 1;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadEnv();

  let finding;
  try {
    const raw = JSON.parse(await fs.promises.readFile(args.inputPath, 'utf8'));
    finding = FindingSchema.parse(raw);
  } catch (e) {
    if (e?.issues) {
      const msgs = e.issues.map(i => `"${i.path.join('.')}": expected ${i.expected}, received ${i.received}`);
      throw new Error(`Finding validation failed:\n  ${msgs.join('\n  ')}`);
    }
    throw e;
  }
  const reportFormat = args.format || (process.env.REPORT_FORMAT || 'markdown').toLowerCase();
  const includeAdf = reportFormat === 'adf';
  const includeMarkdown = reportFormat === 'markdown'
    || (process.env.GENERATE_MARKDOWN_COPY || 'false').toLowerCase() === 'true';
  const output = selectOutputPaths(finding.summary, includeAdf, includeMarkdown);

  const jiraPayload = includeAdf ? generateAdf(finding, {
    cloudId: process.env.JIRA_CLOUD_ID,
    projectKey: process.env.JIRA_PROJECT_KEY,
    issueTypeName: process.env.JIRA_ISSUE_TYPE || 'Bug',
    parent: process.env.JIRA_PARENT_ISSUE || undefined,
    responseContentFormat: process.env.JIRA_RESPONSE_CONTENT_FORMAT || 'markdown',
  }) : null;
  const markdownTemplate = resolveConfiguredPath(
    process.env.REPORT_TEMPLATE_PATH,
    path.join(sourceRoot, 'templates', 'markdown', 'bug-template.md'),
  );
  const markdown = includeMarkdown ? renderMarkdown(finding, markdownTemplate) : null;

  await Promise.all([
    includeAdf ? fs.promises.mkdir(output.adfDir, { recursive: true }) : Promise.resolve(),
    includeMarkdown ? fs.promises.mkdir(output.markdownDir, { recursive: true }) : Promise.resolve(),
  ]);
  await Promise.all([
    includeAdf
      ? fs.promises.writeFile(output.adfPath, `${JSON.stringify(jiraPayload, null, 2)}\n`)
      : Promise.resolve(),
    includeMarkdown ? fs.promises.writeFile(output.markdownPath, markdown) : Promise.resolve(),
  ]);

  process.stdout.write(`${JSON.stringify({
    format: reportFormat,
    adfPath: includeAdf ? output.adfPath : null,
    markdownPath: includeMarkdown ? output.markdownPath : null,
  })}\n`);
}

main().catch(error => {
  process.stderr.write((error.message || String(error)) + "\n");
  process.exitCode = 1;
});
