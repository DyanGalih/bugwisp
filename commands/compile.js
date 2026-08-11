const fs = require('fs');
const path = require('path');
const { generateAdf } = require('../lib/adf-generator');
const { renderMarkdown } = require('../lib/markdown-generator');
const { renderFinalReport, EngagementFindingSchema } = require('../lib/pt-report-generator');

function parseArgs() {
  const args = process.argv.slice(2);
  let dir = './findings';
  const dirIndex = args.indexOf('--dir');
  if (dirIndex !== -1 && args[dirIndex + 1]) {
    dir = args[dirIndex + 1];
  }
  return { dir: path.resolve(process.cwd(), dir) };
}

async function execute() {
  const cwd = process.cwd();
  const engagementPath = path.join(cwd, 'engagement.json');
  
  if (!fs.existsSync(engagementPath)) {
    process.stderr.write(`Error: engagement.json not found at ${engagementPath}. Please run 'bugwisp scaffold' first.\n`);
    process.exitCode = 1;
    return;
  }
  
  const engagementRaw = await fs.promises.readFile(engagementPath, 'utf8');
  let engagement;
  try {
    engagement = JSON.parse(engagementRaw);
  } catch (e) {
    process.stderr.write(`Error parsing engagement.json: ${e.message}\n`);
    process.exitCode = 1;
    return;
  }

  // Ensure findings array exists
  if (!Array.isArray(engagement.findings)) {
    engagement.findings = [];
  }

  const { dir } = parseArgs();
  
  let files = [];
  try {
    files = await fs.promises.readdir(dir);
  } catch (e) {
    process.stderr.write(`Warning: Findings directory not found at ${dir}, generating report without external findings.\n`);
  }

  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  const outputMarkdownDir = path.join(cwd, 'reporting', 'output', 'markdown');
  const outputAdfDir = path.join(cwd, 'reporting', 'output', 'adf');
  const outputFinalDir = path.join(cwd, 'reporting', 'output', 'final');
  
  await fs.promises.mkdir(outputMarkdownDir, { recursive: true });
  await fs.promises.mkdir(outputAdfDir, { recursive: true });
  await fs.promises.mkdir(outputFinalDir, { recursive: true });

  let validFindingsCount = 0;

  for (const file of jsonFiles) {
    const findingPath = path.join(dir, file);
    const content = await fs.promises.readFile(findingPath, 'utf8');
    let rawFinding;
    try {
      rawFinding = JSON.parse(content);
    } catch (e) {
      process.stderr.write(`Error parsing ${file}: ${e.message}\n`);
      continue;
    }
    
    try {
      const validFinding = EngagementFindingSchema.parse(rawFinding);
      engagement.findings.push(validFinding);
      validFindingsCount++;
      
      const mdReport = renderMarkdown(validFinding);
      await fs.promises.writeFile(path.join(outputMarkdownDir, file.replace('.json', '.md')), mdReport);
      
      const jiraConfig = { cloudId: "local", projectKey: "PT", issueTypeName: "Bug" };
      const adfPayload = generateAdf(validFinding, jiraConfig);
      await fs.promises.writeFile(path.join(outputAdfDir, file), JSON.stringify(adfPayload, null, 2));
      
    } catch (e) {
      if (e?.issues) {
        const msgs = e.issues.map(i => `"${i.path.join('.')}": expected ${i.expected}, received ${i.received}`);
        process.stderr.write(`Validation failed for ${file}:\n  ${msgs.join('\n  ')}\n`);
      } else {
        process.stderr.write(`Validation error for ${file}: ${e.message}\n`);
      }
    }
  }

  try {
    const finalReport = renderFinalReport(engagement);
    const finalReportPath = path.join(outputFinalDir, 'pentest-report.md');
    await fs.promises.writeFile(finalReportPath, finalReport);
    process.stdout.write(`Successfully compiled ${validFindingsCount} findings into final report at ${finalReportPath}\n`);
  } catch (e) {
    if (e?.issues) {
      const msgs = e.issues.map(i => `"${i.path.join('.')}": expected ${i.expected}, received ${i.received}`);
      process.stderr.write(`Final engagement validation failed:\n  ${msgs.join('\n  ')}\n`);
    } else {
      process.stderr.write(`Error generating final report: ${e.message}\n`);
    }
    process.exitCode = 1;
  }
}

module.exports = { execute };
