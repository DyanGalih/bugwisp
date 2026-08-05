// Ponytail: final PT report generator — one file, one export, pure functions.
// Validates a single engagement JSON with Zod, renders the consolidated
// Markdown report skeleton, and embeds existing per-finding renderer output.

const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { FindingSchema } = require('./adf-generator');
const { renderMarkdown } = require('./markdown-generator');

const DEFAULT_TEMPLATE = path.join(__dirname, '..', 'templates', 'markdown', 'pt-report-template.md');

const PLACEHOLDER = '{{placeholder}}';
const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Informational'];

const EngagementFindingSchema = FindingSchema.extend({
  status: z.string().min(1).optional().default('Open'),
});

const EngagementSchema = z.object({
  project_name: z.string().min(1),
  client_name: z.string().min(1),
  assessment_type: z.string().min(1),
  environment: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  report_version: z.string().min(1),
  report_date: z.string().min(1),
  classification: z.string().min(1),
  in_scope: z.string().min(1),
  out_of_scope: z.string().min(1),
  assessment_team: z.string().optional(),
  methodology: z.string().optional(),
  tools: z.array(z.string()).optional(),
  target_inventory: z.array(z.string()).optional(),
  executive_summary: z.string().optional(),
  executive_recommendations: z.array(z.string()).optional(),
  engagement_objectives: z.string().optional(),
  rules_of_engagement: z.string().optional(),
  risk_themes: z.string().optional(),
  attack_path_summary: z.string().optional(),
  positive_findings: z.string().optional(),
  conclusion: z.string().optional(),
  findings: z.array(EngagementFindingSchema).min(1),
});

function replaceAll(text, placeholder, value) {
  return text.split(placeholder).join(value);
}

function orPlaceholder(value) {
  return value === undefined || value === null ? PLACEHOLDER : String(value);
}

function severityRank(severity) {
  const rank = SEVERITY_ORDER.indexOf(severity);
  return rank === -1 ? SEVERITY_ORDER.length : rank;
}

function sortFindings(findings) {
  return [...findings].sort((a, b) => severityRank(a.cvssSeverity) - severityRank(b.cvssSeverity));
}

function buildMetadataTable(e) {
  const rows = [
    ['Project', e.project_name],
    ['Client', e.client_name],
    ['Assessment Type', e.assessment_type],
    ['Environment', e.environment],
    ['Test Window', `${e.start_date} -- ${e.end_date}`],
    ['Report Version', e.report_version],
    ['Report Date', e.report_date],
    ['Assessment Team', orPlaceholder(e.assessment_team)],
    ['Classification', e.classification],
  ];
  return rows.map(([label, value]) => `  ${label.padEnd(18)} ${value}`).join('\n');
}

function buildFindingsTable(findings) {
  return findings
    .map((f, i) => {
      const id = String(i + 1).padStart(2, '0');
      return `  FIND-${id}   ${f.summary}   ${f.cvssSeverity}   ${f.cvssScore}   ${f.status}`;
    })
    .join('\n');
}

function buildDetailedFindings(findings) {
  return findings
    .map((f, i) => {
      const id = `FIND-${String(i + 1).padStart(2, '0')}`;
      const body = renderMarkdown(f);
      const headingStripped = body.replace(/^# .*\n+/, '');
      return `## ${id} - ${f.summary}\n\n${headingStripped.trimEnd()}`;
    })
    .join('\n\n------------------------------------------------------------------------\n\n');
}

function buildListTable(title, items) {
  if (!items || items.length === 0) return PLACEHOLDER;
  const rows = items.map(item => `  ${item}`).join('\n');
  return `  ${title}\n  ----\n${rows}`;
}

function buildRiskCounts(findings) {
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0, Informational: 0 };
  for (const f of findings) {
    if (counts[f.cvssSeverity] !== undefined) counts[f.cvssSeverity] += 1;
  }
  return counts;
}

function buildRecommendations(items) {
  if (!items || items.length === 0) return PLACEHOLDER;
  return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
}

function renderFinalReport(engagement, templatePath = DEFAULT_TEMPLATE) {
  const e = EngagementSchema.parse(engagement);
  const report = fs.readFileSync(templatePath, 'utf8');
  const findings = sortFindings(e.findings);
  const counts = buildRiskCounts(findings);

  const values = [
    ['{{metadata_table}}', buildMetadataTable(e)],
    ['{{executive_summary}}', orPlaceholder(e.executive_summary)],
    ['{{critical_count}}', counts.Critical],
    ['{{high_count}}', counts.High],
    ['{{medium_count}}', counts.Medium],
    ['{{low_count}}', counts.Low],
    ['{{info_count}}', counts.Informational],
    ['{{executive_recommendations}}', buildRecommendations(e.executive_recommendations)],
    ['{{engagement_objectives}}', orPlaceholder(e.engagement_objectives)],
    ['{{rules_of_engagement}}', orPlaceholder(e.rules_of_engagement)],
    ['{{in_scope}}', e.in_scope],
    ['{{out_of_scope}}', e.out_of_scope],
    ['{{risk_themes}}', orPlaceholder(e.risk_themes)],
    ['{{attack_path_summary}}', orPlaceholder(e.attack_path_summary)],
    ['{{findings_summary_table}}', buildFindingsTable(findings)],
    ['{{detailed_findings}}', buildDetailedFindings(findings)],
    ['{{positive_findings}}', orPlaceholder(e.positive_findings)],
    ['{{conclusion}}', orPlaceholder(e.conclusion)],
    ['{{tools_table}}', buildListTable('Tool', e.tools)],
    ['{{target_inventory_table}}', buildListTable('Target', e.target_inventory)],
  ];

  return values.reduce((acc, [placeholder, value]) => replaceAll(acc, placeholder, String(value)), report);
}

module.exports = { renderFinalReport, EngagementSchema, EngagementFindingSchema };
