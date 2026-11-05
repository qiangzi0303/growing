import type { APIRequestContext } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// One worker, real production-configured local AUTH_LIMITER (20/minute).
// Pace before issuing requests; never retry a login or bypass Worker limiting.
export async function loginPost(request: APIRequestContext, options: Parameters<APIRequestContext['post']>[1]) {
  const file = resolve(process.cwd(), '../../.nmai/tmp/console-auth-last-request.txt');
  let last = 0;
  try { last = Number(readFileSync(file, 'utf8')) || 0; } catch { /* first run */ }
  const delay = Math.max(0, last + 4200 - Date.now());
  if (delay) await new Promise(resolve => setTimeout(resolve, delay));
  writeFileSync(file, String(Date.now()));
  return request.post('/api/auth/login', options);
}
