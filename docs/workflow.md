# 🔄 Reporting Workflow

## 📝 Raw Finding Input

For the shortest intake, use [`../templates/raw/finding-input-simple.md`](../templates/raw/finding-input-simple.md):

```bash
cp templates/raw/finding-input-simple.md raw-finding.md
```

It only asks for:

1. URL and action, such as `GET https://target.example/path`
2. Steps to reproduce
3. POC or the text `Screenshot will be provided`

Use [`../templates/raw/finding-input.md`](../templates/raw/finding-input.md) when you want to provide complete requests, responses, classifications, screenshot context, and other optional details:

```bash
cp templates/raw/finding-input.md raw-finding.md
```

Then ask the installed skill to process the file:

```text
/bugwisp.bug-report Generate a report from raw-finding.md
```

The detailed template also provides optional fields for a suggested title, CVSS, OWASP category, CWE, description, impact, expected result, recommendation, references, and notes. Leave unknown optional fields blank; the skill will derive supported values from the evidence or use `[N/A]`.

`Screenshot will be provided` is a placeholder, not evidence. The skill will request the screenshot or a description of what it proves before finalizing the report.

Before sharing or committing raw finding files, redact credentials, session cookies, API keys, personal data, and other secrets.

## ⚙️ Configuration

| Variable | Purpose | Example |
| --- | --- | --- |
| `JIRA_BOARD_URL` | Jira board URL | `https://your-org.atlassian.net/jira/software/projects/APP/boards/1` |
| `JIRA_BOARD_ID` | Jira board identifier | `1` |
| `JIRA_PROJECT_KEY` | Jira project key | `APP` |
| `JIRA_PARENT_ISSUE` | Optional parent issue | `APP-100` |
| `JIRA_CLOUD_ID` | Atlassian site identifier | `00000000-0000-0000-0000-000000000000` |
| `REPORT_FORMAT` | Delivery format: `markdown` or `adf` | `markdown` |
| `GENERATE_MARKDOWN_COPY` | Save Markdown locally when using Jira/ADF | `true` |
| `REPORT_TEMPLATE_PATH` | Markdown template | `templates/markdown/bug-template.md` |
| `ADF_TEMPLATE_PATH` | ADF JSON template | `templates/adf/bug-template.json` |

`.env` is gitignored. Never commit real project details, tokens, or credentials.

### Get the Jira Cloud ID

Replace `[workspace]` with your Atlassian workspace name and open:

```text
https://[workspace].atlassian.net/_edge/tenant_info
```

Raw HTTP request:

```http
GET /_edge/tenant_info HTTP/1.1
Host: [workspace].atlassian.net
Accept: application/json
```

Terminal equivalent:

```bash
curl --request GET \
  --url "https://[workspace].atlassian.net/_edge/tenant_info" \
  --header "Accept: application/json"
```

Example response:

```json
{
  "cloudId": "00000000-0000-0000-0000-000000000000",
  "tenantId": "00000000-0000-0000-0000-000000000000",
  "realm": "prod"
}
```

The UUID above is illustrative. Copy the `cloudId` returned by your workspace into `.env`.

### Configure Jira MCP in VS Code

Add the Atlassian Rovo MCP server to `.vscode/mcp.json`:

```json
{
  "servers": {
    "jira": {
      "type": "http",
      "url": "https://mcp.atlassian.com/v1/mcp",
      "gallery": "https://api.mcp.github.com",
      "version": "1.1.3"
    }
  },
  "inputs": []
}
```

Start the `jira` server and complete Atlassian OAuth authorization in your browser. The `gallery` and `version` fields are GitHub MCP Registry metadata; other MCP clients use different configuration schemas and locations.

If the default endpoint has authentication or cached-client issues, current Atlassian IDE guidance recommends:

```text
https://mcp.atlassian.com/v1/mcp/authv2
```

## 🔄 Reporting Workflow Steps

1. Provide the raw vulnerability details.

   ![Submitting raw vulnerability details to the reporting skill](images/prompt-full-raw.jpg)

2. Review the structured report generated from the evidence.

   ![Generated structured vulnerability report](images/report-generated.jpg)

3. Post the completed report to Jira.

   ![Posting the generated vulnerability report to Jira](images/posting-in-jira.jpg)

The generated report contains: CVSS Score, OWASP Top 10 Category, Affected Asset or Endpoint, Description, Steps to Reproduce, Evidence or POC, and Recommendation.

## 📂 Report Output

Output files are separated by format:

```text
reporting/output/
├── final/
│   └── pentest-report.md
├── markdown/
│   └── vulnerability-title.md
└── adf/
    └── vulnerability-title.json
```

- `REPORT_FORMAT=markdown` saves the completed report under `reporting/output/markdown/`.
- `REPORT_FORMAT=adf` creates the Jira issue through MCP.
- `GENERATE_MARKDOWN_COPY=true` also saves a local Markdown copy after successful Jira delivery.
- If Jira MCP fails after its allowed retry, the skill saves matching Markdown and ADF fallback files automatically.
- Existing reports are not overwritten; a numeric suffix is added when needed.
