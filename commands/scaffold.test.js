const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execute } = require('./scaffold');

test('scaffold command should generate engagement.json and prevent overwrite', async (t) => {
  const testDir = path.join(__dirname, '..', '..', 'test-tmp-scaffold');
  await fs.promises.mkdir(testDir, { recursive: true });
  const originalCwd = process.cwd();
  
  try {
    process.chdir(testDir);
    
    // Test 1: Scaffold should create file
    await execute();
    const engagementPath = path.join(testDir, 'engagement.json');
    assert.ok(fs.existsSync(engagementPath), 'engagement.json should be created');
    
    const content = JSON.parse(await fs.promises.readFile(engagementPath, 'utf8'));
    assert.strictEqual(content.project_name, 'Example Project', 'Should contain template data');
    
    // Test 2: Scaffold should not overwrite
    let stderrOutput = '';
    const originalStderrWrite = process.stderr.write;
    process.stderr.write = (chunk) => { stderrOutput += chunk; return true; };
    process.exitCode = 0;
    
    await execute();
    
    process.stderr.write = originalStderrWrite;
    assert.strictEqual(process.exitCode, 1, 'Process should exit with code 1 when file exists');
    assert.ok(stderrOutput.includes('already exists'), 'Should print error message');
    
  } finally {
    process.exitCode = 0; // Reset exit code
    process.chdir(originalCwd);
    await fs.promises.rm(testDir, { recursive: true, force: true });
  }
});
