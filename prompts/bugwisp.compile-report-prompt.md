---
name: bugwisp.compile
description: Skill for AI agents instructing them to use the JSON data flow and bugwisp compile command instead of manually formatting reports.
---

# Bugwisp Reporting Workflow

When the user asks you to generate a penetration testing report or convert findings into Markdown/ADF, you **MUST NOT** format the Markdown or ADF yourself. Doing so consumes excessive LLM tokens and bypasses our validation logic.

Instead, you must use the following JSON-based workflow:

1. **Scaffold the project**:
   If `engagement.json` does not exist in the workspace, run the following command to generate it:
   ```bash
   bugwisp scaffold
   ```

2. **Generate Findings**:
   For each finding the user wants to add, create a raw JSON file in the `./findings/` directory (e.g. `./findings/xss.json`, `./findings/sqli.json`). The JSON MUST conform to the strict `EngagementFindingSchema` (which requires fields like `summary`, `cvssScore`, `cvssSeverity`, `cwe`, `description`, etc.).

3. **Compile the Reports**:
   Once all finding JSON files are created and `engagement.json` is updated with any executive summaries, run the compiler:
   ```bash
   bugwisp compile --dir ./findings
   ```

4. **Verify**:
   The compiler will validate all JSON files against Zod schemas and automatically generate:
   - The final aggregated report (`reporting/output/final/pentest-report.md`)
   - Individual markdown findings (`reporting/output/markdown/*.md`)
   - Individual Jira ADF payloads (`reporting/output/adf/*.json`)

If the compiler throws Zod validation errors, fix the JSON files according to the error output and run the compile command again.
