const assert = require('node:assert');
const { installSkill, AGENT_CONFIGS } = require('./installer');

assert.ok(Object.keys(AGENT_CONFIGS).length > 0, 'Must have agent configs');
assert.throws(
    () => installSkill('unsupported-agent', '/tmp/test.md'),
    /Unsupported agent/
);

console.log('installer.test.js: OK');
