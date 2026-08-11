<p align="center">
  <img src="https://raw.githubusercontent.com/DyanGalih/bugwisp/main/docs/images/bugwisp-mascot.png" alt="BugWisp ghost mascot holding a security report" width="240">
</p>

# 👻 BugWisp v0.2.0

**From raw proof to polished reports.**

[![Version](https://img.shields.io/badge/version-0.2.0-22c55e)](package.json)
[![CLI](https://img.shields.io/badge/CLI-optimized-blue)](package.json)
[![Agents](https://img.shields.io/badge/Agents-34%2B%20supported-10b981)](#-supported-agents)

BugWisp is a local CLI tool and a set of AI coding agent skills that standardize and automate Penetration Testing reporting workflows into Markdown and Jira ADF. It installs the `bugwisp.*` skills natively for 34+ AI coding agents, including Claude Code, Cursor, GitHub Copilot, Codex, Gemini, and OpenCode.

The skills collect missing vulnerability details, generate optional report content from evidence, and rely on the local BugWisp CLI to compile, validate, and render the final Markdown or Atlassian Document Format (ADF) reports, or create Jira issues through Atlassian Rovo MCP.

---

## 📖 Documentation

* [Reporting Workflow & Configuration](docs/workflow.md) — Raw finding inputs, Jira configuration, outputs, and the reporting lifecycle.
* [Roadmap](docs/roadmap.md) — Future plans for Stage 2 (Engagement Reporting) and Stage 3 (Multi-Project).

---

## 🆕 What's New in v0.2.0
- **Report Compiler CLI Pipeline**: Replaced token-heavy LLM report formatting with an efficient local CLI formatting pipeline (`bugwisp scaffold` and `bugwisp compile`).
- **AI Agent Skills (`bugwisp.*`)**: Prompts have been completely refactored and prefixed with `bugwisp.` to enforce using the CLI pipeline for generating final artifacts instead of hallucinating Markdown/ADF themselves.
- **Smart Skill Installer**: `bugwisp init` now extracts explicit plugin names and descriptions directly from YAML frontmatter instead of relying on filenames, preventing double-frontmatter issues across IDEs.

## ✨ Why Use It?

- Produce consistent reports with mandatory security fields.
- Convert raw requests, responses, logs, and screenshots into structured findings.
- Compile all findings into a final engagement report automatically using strict schemas.
- Generate human-readable Markdown and Jira-ready ADF from shared evidence without token bloat.
- Create Jira issues through MCP without manually copying JSON payloads.
- Preserve local Markdown and ADF files when Jira delivery fails.
- Install the same reporting workflow across many AI coding agents.

## 🚀 Quick Start

1. Install the scoped CLI globally:

   ```bash
   npm install --global @dyangalih/bugwisp
   ```

2. Create your local configuration:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your Jira project and reporting preferences.

4. Install the skills to your AI agent IDEs:

   ```bash
   bugwisp init
   ```

5. Scaffold your reporting project (creates `engagement.json`):

   ```bash
   bugwisp scaffold
   ```

6. Select one or more agents, then invoke the installed skill to create a finding:

   ```text
   /bugwisp.bug-report I found an XSS vulnerability in the login form at /auth/login...
   ```

   The AI will generate structured JSON files inside the `./findings/` directory.

7. Compile the final reports:

   ```bash
   bugwisp compile --dir ./findings
   ```

The skill asks for missing mandatory fields as free text. Optional fields are generated from the supplied evidence unless you provide them explicitly.

[Learn more about the full workflow →](docs/workflow.md)

## 🤖 Supported Agents

| Agent type | Installed format | Result |
| --- | --- | --- |
| OpenCode | `.opencode/commands/*.md` | `/bugwisp.bug-report` command |
| Claude Code | `.claude/skills/<name>/SKILL.md` | `/bugwisp.bug-report` command |
| Cursor | `.cursor/skills/*.md` | Auto-applied skill |
| GitHub Copilot | `.github/skills/<name>/SKILL.md` | `@copilot` prompt |
| Gemini | `.gemini/commands/*.toml` | TOML command |
| Goose | `.goose/recipes/*.yaml` | YAML recipe |
| Codex, Zed, agy | `.agents/skills/<name>/SKILL.md` | Native skill |
| 27+ additional agents | Agent-specific format | Native command or skill |

## 🗂️ Project Structure

```text
.
├── index.js                    CLI entry point
├── engagement.json             Engagement metadata (scaffolded)
├── commands/
│   ├── init.js                 Interactive agent installer
│   ├── scaffold.js             Project scaffolder
│   └── compile.js              Report compiler logic
├── lib/
│   ├── installer.js            Agent-specific skill installer
│   ├── markdown-generator.js   Markdown rendering logic
│   ├── adf-generator.js        Jira ADF rendering logic
│   └── pt-report-generator.js  Final report aggregation
├── prompts/
│   ├── bugwisp.bug-report.md   Reporting workflow skill
│   ├── bugwisp.compile.md      Compiler pipeline skill
│   └── bugwisp.markdown.md     Markdown generator skill
├── templates/
│   ├── raw/                    Simple and detailed raw input templates
│   ├── markdown/               Markdown report templates
│   └── adf/                    Jira ADF template
├── reporting/
│   ├── archived/               Archived reference findings
│   └── output/
│       ├── final/              Aggregated engagement reports
│       ├── markdown/           Generated Markdown reports
│       └── adf/                Generated ADF payloads
├── docs/
│   ├── workflow.md             Workflow and Configuration
│   ├── roadmap.md              Roadmap and Plans
│   └── images/                 README screenshots
├── config/                     Security classification mappings
└── .env.example               Configuration template
```

## 🧪 Development

Run the test suite:

```bash
npm test
```
