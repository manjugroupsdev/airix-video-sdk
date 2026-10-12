import assert from 'node:assert/strict'
import { test } from 'node:test'
import { retryRegistryInstall } from './registry-consumer.mjs'

test('consumer retries unpublished install metadata but fails other install errors', async () => {
  let calls = 0
  await retryRegistryInstall(() => {
    if (++calls < 3) throw Object.assign(new Error('metadata pending'), { stderr: 'npm error code ETARGET' })
  }, async () => {}, 3)
  assert.equal(calls, 3)
  await assert.rejects(retryRegistryInstall(() => { throw new Error('ERESOLVE') }, async () => {}, 3), /ERESOLVE/)
  await assert.rejects(retryRegistryInstall(() => { throw Object.assign(new Error('ETARGET'), { stderr: 'npm error code ETARGET' }) }, async () => {}, 2), /ETARGET/)
})
