import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
const require = createRequire(import.meta.url)
for (const [name, symbol] of [['core', 'AirixVideoClient'], ['react', 'AirixVideoConference'], ['webhooks', 'verifyAirixWebhook']]) {
  const esm = await import(`../${name}/dist/index.js`)
  const common = require(`../${name}/dist/index.cjs`)
  assert.equal(typeof esm[symbol], 'function', `${name} ESM export`)
  assert.equal(typeof common[symbol], 'function', `${name} CJS export`)
  assert.ok((await readFile(new URL(`../${name}/dist/index.d.ts`, import.meta.url), 'utf8')).length)
}
console.log('ESM, CJS, and declaration artifacts verified for all Web SDK packages.')
