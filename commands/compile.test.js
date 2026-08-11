const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execute } = require('./compile');

test('compile command should generate reports from findings', async (t) => {
  const testDir = path.join(__dirname, '..', '..', 'test-tmp-compile');
  await fs.promises.mkdir(testDir, { recursive: true });
  const findingsDir = path.join(testDir, 'findings');
  await fs.promises.mkdir(findingsDir, { recursive: true });
  const originalCwd = process.cwd();
  
  try {
    process.chdir(testDir);
    
    // Create engagement.json
    const engagement = {
      project_name: "Test Compile",
      client_name: "Test Client",
      assessment_type: "Web Application Penetration Test",
      environment: "Production",
      start_date: "2024-01-01",
      end_date: "2024-01-14",
      report_version: "1.0",
      report_date: "2024-01-15",
      classification: "Confidential",
      in_scope: "https://test.com",
      out_of_scope: "None",
      executive_summary: "Summary",
      executive_recommendations: ["Rec 1"],
      engagement_objectives: "Objective",
      rules_of_engagement: "Rules",
      risk_themes: "Themes",
      attack_path_summary: "Attack Path",
      positive_findings: "Positives",
      conclusion: "Conclusion",
      tools: ["Nmap"],
      target_inventory: ["https://test.com"],
      findings: []
    };
    await fs.promises.writeFile('engagement.json', JSON.stringify(engagement, null, 2));
    
    // Create mock finding
    const finding = {
      summary: "Test Vuln",
      cvssScore: "5.0",
      cvssSeverity: "Medium",
      cvssVector: "AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N",
      owaspCategory: "A01",
      cwe: "CWE-1",
      path: "GET /",
      description: "Desc",
      impact: "Impact",
      stepsToReproduce: ["Step 1"],
      evidenceText: "Evidence",
      recommendation: "Rec",
    };
    await fs.promises.writeFile(path.join(findingsDir, 'vuln.json'), JSON.stringify(finding, null, 2));
    
    // Stub parseArgs by passing mock argv
    process.argv = ['node', 'bugwisp', 'compile', '--dir', './findings'];
    
    // Suppress stdout
    const originalStdoutWrite = process.stdout.write;
    process.stdout.write = () => { return true; };
    
    await execute();
    
    process.stdout.write = originalStdoutWrite;
    
    assert.strictEqual(process.exitCode, 0 || undefined, 'Process should exit with code 0');
    
    const finalReportPath = path.join(testDir, 'reporting', 'output', 'final', 'pentest-report.md');
    assert.ok(fs.existsSync(finalReportPath), 'final pentest-report.md should be created');
    
    const mdPath = path.join(testDir, 'reporting', 'output', 'markdown', 'vuln.md');
    assert.ok(fs.existsSync(mdPath), 'finding markdown should be created');
    
    const adfPath = path.join(testDir, 'reporting', 'output', 'adf', 'vuln.json');
    assert.ok(fs.existsSync(adfPath), 'finding adf should be created');
    
  } finally {
    process.exitCode = 0; // Reset exit code
    process.chdir(originalCwd);
    await fs.promises.rm(testDir, { recursive: true, force: true });
  }
});
