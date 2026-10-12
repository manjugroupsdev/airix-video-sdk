import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile, mkdir, lstat } from 'node:fs/promises'
import { resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(process.env.AIRIX_SDK_RELEASE_ROOT ?? fileURLToPath(new URL('../', import.meta.url)))
const npm = (args, cwd = root) => execFileSync('npm', args, { cwd, encoding: 'utf8' }).trim()
const integrity = bytes => 'sha512-' + createHash('sha512').update(bytes).digest('base64')
const plan = JSON.parse(await readFile(resolve(root, 'release-plan.json'), 'utf8'))

export async function validateRelease(directory, sha) {
  assert.match(sha, /^[a-f0-9]{40}$/, 'invalid release SHA')
  const manifest = JSON.parse(await readFile(resolve(directory, 'manifest.json'), 'utf8'))
  assert.equal(manifest.sourceSha, sha, 'release SHA mismatch')
  assert.deepEqual(manifest.packages.map(item => item.name).sort(), Object.keys(plan).sort(), 'package set mismatch')
  for (const item of manifest.packages) {
    assert.equal(item.version, plan[item.name], 'unapproved version')
    assert.equal(item.filename, `${item.name}-${item.version}.tgz`, 'invalid package filename')
    assert.equal(basename(item.filename), item.filename)
    const path = resolve(directory, item.filename)
    assert.ok((await lstat(path)).isFile(), 'package must be a regular file')
    assert.equal(integrity(await readFile(path)), item.integrity, 'package integrity mismatch')
  }
  return manifest
}

async function pack(directory, sha) {
  assert.match(sha, /^[a-f0-9]{40}$/)
  await mkdir(directory, { recursive: true })
  const manifest = { sourceSha: sha, packages: [] }
  const ownPackage = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
  const directories = { 'airix-video-core': 'core', 'airix-video-react': 'react', 'airix-video-webhooks': 'webhooks' }
  for (const name of Object.keys(plan)) {
    const workspace = ownPackage.name === name ? '.' : directories[name]
    assert.ok(workspace, 'unknown release package')
    const metadata = JSON.parse(await readFile(resolve(root, workspace, 'package.json'), 'utf8'))
    assert.equal(metadata.version, plan[metadata.name], 'release plan must match package version')
    const workspaceArgs = workspace === '.' ? [] : ['--workspace', metadata.name]
    const [packed] = JSON.parse(npm(['pack', ...workspaceArgs, '--ignore-scripts', '--json', '--pack-destination', directory]))
    manifest.packages.push({ name: packed.name, version: packed.version, filename: packed.filename, integrity: packed.integrity })
  }
  await writeFile(resolve(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  await validateRelease(directory, sha)
}

async function publish(directory, sha) {
  const manifest = await validateRelease(directory, sha)
  npm(['whoami', '--registry', 'https://registry.npmjs.org'])
  const published = new Set()
  for (const item of manifest.packages) {
    let existing
    try {
      existing = JSON.parse(npm(['view', `${item.name}@${item.version}`, 'dist.integrity', '--json', '--registry', 'https://registry.npmjs.org']))
    } catch (error) {
      const response = `${error.stdout ?? ''}\n${error.stderr ?? ''}`
      if (!/E404/.test(response)) throw error
    }
    if (existing) {
      assert.equal(existing, item.integrity, 'existing registry version differs from checked artifact')
      published.add(item.name)
    }
  }
  for (const item of manifest.packages) {
    if (!published.has(item.name)) {
      npm(['publish', resolve(directory, item.filename), '--ignore-scripts', '--access', 'public', '--tag', 'latest', '--registry', 'https://registry.npmjs.org'])
    }
    const remote = JSON.parse(npm(['view', `${item.name}@${item.version}`, 'dist.integrity', '--json', '--registry', 'https://registry.npmjs.org']))
    assert.equal(remote, item.integrity, 'published registry integrity mismatch')
    console.log(`Verified ${item.name}@${item.version}: ${item.integrity}`)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [operation, directory, sha] = process.argv.slice(2)
  assert.ok(directory && sha, 'expected operation, artifact directory and SHA')
  if (operation === 'pack') await pack(resolve(directory), sha)
  else if (operation === 'validate') await validateRelease(resolve(directory), sha)
  else if (operation === 'publish') await publish(resolve(directory), sha)
  else throw new Error('unknown release operation')
}
