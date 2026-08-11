# BugWisp

BugWisp installs public reporting skills for AI coding agents and provides a local CLI to standardize and automate Penetration Testing reporting workflows into Markdown and Jira ADF.

## What's New in v0.2.0
- **Report Compiler CLI Pipeline**: Replaced token-heavy LLM report formatting with an efficient local CLI formatting pipeline (`bugwisp scaffold` and `bugwisp compile`).
- **AI Agent Skills (`bugwisp.*`)**: Prompts have been completely refactored and prefixed with `bugwisp.` to enforce using the CLI pipeline for generating final artifacts instead of hallucinating Markdown/ADF themselves.
- **Smart Skill Installer**: `bugwisp init` now extracts explicit plugin names and descriptions directly from YAML frontmatter instead of relying on filenames, preventing double-frontmatter issues across IDEs.

## Install

Install the scoped CLI and provision the bundled skills:

```bash
npm install --global @dyangalih/bugwisp
bugwisp init
```

Select one or more supported targets when prompted, including:

- `.agent`
- `.cursor`
- `.opencode`
- Claude Code, Codex, GitHub Copilot, Gemini, and other configured agents

The installer rejects unsupported targets, refuses to overwrite existing files, validates target containment, and rolls back all files created by a failed multi-target installation.

Installed skills include:

- `bugwisp.bug-report`
- `bugwisp.compile`
- `bugwisp.markdown-generator`

Public report templates are copied under `.bugwisp/templates/` in the selected workspace.

## Step-by-Step Usage

1. **Initialize Skills**: Run `bugwisp init` to install the AI skills into your workspace.
2. **Scaffold a Project**: Run `bugwisp scaffold` to generate the `engagement.json` metadata skeleton. Define executive summaries, scopes, and Jira configuration here.
3. **Generate Findings**: Ask your AI agent to create findings based on raw scanner data or penetration testing results. The AI will output structured JSON files inside the `./findings/` directory according to strict Zod schemas.
4. **Compile the Final Reports**: Run `bugwisp compile --dir ./findings` to validate all input data and compile the final aggregated Markdown report and individual Jira ADF payloads.

## Development

From the repository package directory:

```bash
npm install
npm test
```

BugWisp runs as a local CommonJS CLI using `zod` for strict schema validation and `enquirer` for interactive prompts.
