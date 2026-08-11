# 🗺️ Roadmap

The roadmap is organized around a gradual move from individual finding generation to complete engagement reporting and multi-platform publishing.

### Stage 1 — Individual Findings (Current)

- Collect mandatory vulnerability details and derive optional content from evidence.
- Generate consistent Markdown and Jira ADF reports.
- Create Jira issues through Atlassian Rovo MCP.
- Preserve local Markdown and ADF artifacts when Jira delivery fails.
- Install the workflow across supported AI coding agents.

### Stage 2 — Engagement Reports and Publishing (Next)

- Aggregate all findings into a final engagement report with two views (Accomplished in v0.2.0 via CLI Compiler!):
  - an executive summary for management, including risk posture, severity distribution, business impact, and prioritized actions;
  - a technical report for engineering, including complete findings, evidence, reproduction steps, and remediation guidance.
- Introduce a canonical, versioned finding schema so Markdown, ADF, HTML, PDF, and external publishers render the same source data (Accomplished via `EngagementFindingSchema` in v0.2.0!).
- Add pluggable MCP or API publishers for Jira, GitHub Issues, Outline, Confluence, and other reporting platforms.
- Upload POC screenshots and supporting evidence after issue creation.
- Import findings from common security-tool formats such as SARIF, Burp Suite, OWASP ZAP, and structured JSON.
- Add branded report templates and export options for HTML and PDF delivery.

Jira screenshot upload is technically feasible through the [Jira Cloud attachment API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-attachments/). Native MCP upload remains dependent on the tools exposed by the connected MCP server.

### Stage 3 — Multi-Project and Program Reporting (Exploratory)

- Introduce explicit organization, client, engagement, and project boundaries.
- Keep templates, credentials, evidence, and outputs isolated per engagement.
- Track finding lifecycle across draft, published, accepted-risk, remediated, and retest states.
- Synchronize status changes with connected platforms without duplicating findings.
- Generate cross-project dashboards for recurring weaknesses, severity trends, remediation time, and control coverage.
- Add finding fingerprinting and deduplication across scans, retests, and projects.
- Maintain an audit trail of report versions, publication attempts, evidence changes, and external references.

Multi-project support should follow the canonical finding schema and publisher architecture. Building it earlier would couple project management concerns to the current single-finding workflow.
