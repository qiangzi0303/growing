import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { prepareLocal } from './seed-local.mts';
import { cloudflareDirectory, localOrigin, wranglerArguments } from './local-target.mts';

// Never reuse an already running server: it could be someone else's database.
await new Promise<void>((accept, reject) => {
  const probe = createServer();
  probe.once('error', () => reject(Error('Port 8791 is occupied; refusing to reuse it')));
  probe.listen(8791, '127.0.0.1', () => probe.close(error => error ? reject(error) : accept()));
});
await prepareLocal();
console.log(`Local acceptance Worker: ${localOrigin}; no custom build hook, no remote resources`);
const worker = spawn(process.execPath, [resolve(cloudflareDirectory, 'node_modules/wrangler/bin/wrangler.js'), ...wranglerArguments('serve')], {
  cwd: cloudflareDirectory, stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' }
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => worker.kill(signal));
worker.on('exit', code => process.exit(code ?? 1));
