import test from 'node:test';
import { readFile } from 'node:fs/promises';
test('sample component is available to the production entry',async()=>{
 await readFile(new URL('../src/HomeSample.vue',import.meta.url),'utf8');
});
