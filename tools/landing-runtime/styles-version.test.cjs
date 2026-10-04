const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');

test('every public page requests the current local stylesheets', () => {
  for (const page of fs.readdirSync(root).filter(file => file.endsWith('.html') && file !== 'face-test.html')) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    for (const [, file, version] of html.matchAll(/href="((?:app|demo)\/[^"?]+\.css)(?:\?v=([^"?]+))?"/g)) {
      const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex').slice(0, 12);
      assert.equal(version, hash, `${page}: ${file}`);
    }
  }
});
