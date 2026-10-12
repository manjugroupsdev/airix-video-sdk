import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { validateRelease, verifyRegistryIntegrity } from './release.mjs'

test('release rejects a package whose bytes changed after CI', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'airix-release-'))
  try {
    await writeFile(join(directory, 'airix-video-core-0.1.4.tgz'), 'modified')
    await writeFile(join(directory, 'manifest.json'), JSON.stringify({
      sourceSha: 'a'.repeat(40), packages: [
        { name: 'airix-video-core', version: '0.1.4', filename: 'airix-video-core-0.1.4.tgz', integrity: 'sha512-expected' },
        { name: 'airix-video-react', version: '0.1.4' },
        { name: 'airix-video-webhooks', version: '0.1.2' },
      ],
    }))
    await assert.rejects(validateRelease(directory, 'a'.repeat(40)), /integrity mismatch/)
    await assert.rejects(validateRelease(directory, 'b'.repeat(40)), /SHA mismatch/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('publication is gated by successful checks and never exposes npm credentials to builds', async () => {
  const workflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8')
  const [verify, publish] = workflow.split('\n  publish:')
  assert.ok(publish, 'release job exists')
  assert.match(publish, /needs: verify/)
  assert.match(publish, /github\.ref == 'refs\/heads\/main'/)
  assert.match(publish, /needs\.verify\.outputs\.publish == 'true'/)
  assert.match(publish, /digest-mismatch: error/)
  assert.match(publish, /main\.data\.sha !== context\.sha/)
  assert.doesNotMatch(verify, /secrets\.NPM_TOKEN/)
  assert.match(publish, /node scripts\/release\.mjs publish/)
  assert.doesNotMatch(publish, /npm run build|npm ci/)
})

test('publication waits for registry visibility but rejects changed registry bytes', async () => {
  let calls = 0
  await verifyRegistryIntegrity(() => ++calls < 3 ? undefined : 'sha512-checked', 'sha512-checked', 3, async () => {})
  assert.equal(calls, 3)
  await assert.rejects(verifyRegistryIntegrity(() => 'sha512-other', 'sha512-checked', 3, async () => {}), /integrity mismatch/)
  await assert.rejects(verifyRegistryIntegrity(() => undefined, 'sha512-checked', 2, async () => {}), /not visible/)
})
