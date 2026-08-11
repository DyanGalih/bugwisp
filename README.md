# BugWisp

BugWisp installs public reporting skills for AI coding agents.

## Install

Install the scoped CLI and provision the bundled skills:

```bash
npm install --global @dyangalih/bugwisp
bugwisp install
```

Select one or more supported targets when prompted, including:

- `.agent`
- `.cursor`
- `.opencode`
- Claude Code, Codex, GitHub Copilot, Gemini, and other configured agents

The installer rejects unsupported targets, refuses to overwrite existing files, validates target containment, and rolls back all files created by a failed multi-target installation.

Installed skills include:

- `bug-report-prompt`
- `markdown-generator`

Public report templates are copied under `.bugwisp/templates/` in the selected workspace.

## Development

From the repository package directory:

```bash
npm install
npm test
```

BugWisp runs as a local CommonJS CLI with `zod` and `enquirer`.
