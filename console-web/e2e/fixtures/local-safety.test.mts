import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { assertLocalTarget, dbDirectory, localConfig, localOrigin, wranglerArguments } from './local-target.mts';

test('accepts only the dedicated local database and loopback origin', () => {
  assert.doesNotThrow(() => assertLocalTarget(dbDirectory, localOrigin));
  for (const target of [resolve(dbDirectory, '..', 'local-role-preview-db'), resolve(dbDirectory, 'nested')]) {
    assert.throws(() => assertLocalTarget(target, localOrigin));
  }
  for (const origin of ['https://007yx.com', 'http://localhost:8791', 'http://127.0.0.1:8790']) {
    assert.throws(() => assertLocalTarget(dbDirectory, origin));
  }
});

test('all supported Wrangler operations are local and persist to the exact directory', () => {
  for (const operation of ['migrate', 'seed', 'serve'] as const) {
    const args = wranglerArguments(operation);
    assert.ok(args.includes('--local'));
    assert.equal(args[args.indexOf('--persist-to') + 1], dbDirectory);
    assert.ok(!args.includes('--remote'));
    assert.equal(args[args.indexOf('--config') + 1], localConfig);
  }
  assert.throws(() => wranglerArguments('deploy' as never));
});
