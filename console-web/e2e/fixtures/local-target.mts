import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
export const cloudflareDirectory = resolve(projectRoot, 'growing/cloudflare');
export const temporaryDirectory = resolve(projectRoot, '.nmai/tmp');
export const dbDirectory = resolve(temporaryDirectory, 'unified-console-db');
export const localConfig = resolve(temporaryDirectory, 'unified-console-wrangler.json');
export const localOrigin = 'http://127.0.0.1:8791';
export const seedFile = resolve(temporaryDirectory, 'unified-console-seed.sql');

export function assertLocalTarget(directory: string, origin: string) {
  if (resolve(directory) !== dbDirectory || origin !== localOrigin) throw Error('Only the dedicated local acceptance target is allowed');
  for (let current = dbDirectory; current !== dirname(current); current = dirname(current)) {
    if (existsSync(current) && (lstatSync(current).isSymbolicLink() || realpathSync(current).toLowerCase() !== current.toLowerCase())) {
      throw Error('Local database path must not traverse a symbolic link or junction');
    }
    if (current === projectRoot) break;
  }
}

export function wranglerArguments(operation: 'migrate' | 'seed' | 'serve') {
  assertLocalTarget(dbDirectory, localOrigin);
  const common = ['--config', localConfig, '--local', '--persist-to', dbDirectory];
  if (operation === 'migrate') return ['d1', 'migrations', 'apply', 'growing-db', ...common];
  if (operation === 'seed') return ['d1', 'execute', 'growing-db', ...common, '--file', seedFile];
  if (operation === 'serve') return ['dev', ...common, '--ip', '127.0.0.1', '--port', '8791', '--local-upstream', '127.0.0.1'];
  throw Error('Unsupported local operation');
}
