const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const prompt = fs.readFileSync(path.join(__dirname, "bug-report-prompt.md"), "utf8");

test("ADF/Jira failures require explicit Markdown fallback confirmation", () => {
  assert.match(prompt, /ask the user whether to generate or send the Markdown fallback/);
  assert.match(prompt, /If the user confirms, invoke the existing Markdown path/);
  assert.match(prompt, /If the user declines, stop without generating or sending Markdown/);
  assert.match(prompt, /If confirmation is unavailable, stop without generating or sending Markdown/);
  assert.doesNotMatch(prompt, /If Jira returns an error, report the exact MCP error and stop\./);
});
