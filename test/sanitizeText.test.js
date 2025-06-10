const assert = require('assert');
const sanitizeText = (text) => text.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, '');
assert.strictEqual(sanitizeText('<p>Hello</p><script>alert(1)</script>'), 'Hello');
assert.strictEqual(sanitizeText('Safe'), 'Safe');
console.log('All tests passed');
