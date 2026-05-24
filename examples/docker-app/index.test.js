const { describe, it } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('./index');

describe('GET /', () => {
  it('returns 200 with status ok', async () => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/`);
    const body = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'ok');

    server.close();
  });
});
