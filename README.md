# BugWisp v0.2.0

BugWisp is a local CLI tool and set of AI coding agent skills designed to standardize and automate Penetration Testing reporting workflows into Markdown and Jira ADF.

## What's New in v0.2.0
- **Report Compiler CLI Pipeline**: Replaced token-heavy LLM report formatting with an efficient local CLI formatting pipeline (`scaffold` and `compile`).
- **AI Agent Skills (`bugwisp.*`)**: Prompts have been completely refactored, renamed, and improved to enforce using the CLI pipeline for generating final artifacts instead of hallucinating Markdown/ADF themselves.
- **Smart Skill Installer**: `bugwisp init` now extracts explicit plugin names and descriptions directly from YAML frontmatter instead of relying on filenames, preventing double-frontmatter issues across IDEs.

## Installation

Install the scoped CLI globally via npm:

```bash
npm install --global @dyangalih/bugwisp
```

## Step-by-Step Usage

### 1. Initialize Skills for your AI Agents
Provision the bundled skills into your current workspace or project so that your AI IDEs (Cursor, Windsurf, Claude Code, etc.) know how to use BugWisp:

```bash
bugwisp init
```
Select one or more supported targets when prompted (e.g., `.cursor`, `.agent`, `.claude`). The installer will write the skills (`bugwisp.bug-report`, `bugwisp.compile`, etc.) into your local workspace.

### 2. Scaffold a Project
Initialize a new reporting project to create the `engagement.json` metadata skeleton:

```bash
bugwisp scaffold
```
This generates the `engagement.json` file where you define executive summaries, scopes, and Jira configuration.

### 3. Generate Findings
Ask your AI agent to create findings based on raw scanner data or your penetration testing results. The AI will output structured JSON files inside the `./findings/` directory according to strict Zod schemas.

### 4. Compile the Final Reports
Compile the raw JSON findings and `engagement.json` into the final Markdown and Jira ADF payloads:

```bash
bugwisp compile --dir ./findings
```
This command validates all input data and compiles:
- The final aggregated report (`reporting/output/final/pentest-report.md`)
- Individual markdown findings (`reporting/output/markdown/*.md`)
- Individual Jira ADF payloads (`reporting/output/adf/*.json`)

## Development

From the repository package directory:

```bash
npm install
npm test
```

BugWisp runs as a local CommonJS CLI using `zod` for strict schema validation and `enquirer` for interactive prompts.
