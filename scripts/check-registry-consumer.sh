#!/usr/bin/env bash
set -euo pipefail
root="$PWD"
destination="$(mktemp -d)"
trap 'rm -rf "$destination"' EXIT
cd "$destination"
npm init -y >/dev/null
mapfile -t packages < <(node -e 'const p=require(process.argv[1]); for(const [name,version] of Object.entries(p)) console.log(`${name}@${version}`)' "$root/release-plan.json")
npm install --ignore-scripts --registry https://registry.npmjs.org "${packages[@]}"
node --input-type=module <<'JS'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
for (const [name, symbol] of [
  ['airix-video-core', 'AirixVideoClient'],
  ['airix-video-react', 'AirixVideoConference'],
  ['airix-video-webhooks', 'verifyAirixWebhook'],
]) {
  assert.equal(typeof (await import(name))[symbol], 'function')
  assert.equal(typeof require(name)[symbol], 'function')
}
console.log('Registry-only ESM/CJS consumer verified.')
JS
