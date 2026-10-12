import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export async function retryRegistryInstall(install, wait = () => new Promise(resolve => setTimeout(resolve, 5000)), attempts = 30) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try { return await install() } catch (error) {
      if (!/npm error code (ETARGET|E404)\b/.test(String(error.stderr)) || attempt + 1 === attempts) throw error
      console.log('Waiting for npm install metadata to expose the verified version.')
      await wait()
    }
  }
}

async function verifyConsumer(planPath) {
  const plan = JSON.parse(await readFile(planPath, 'utf8'))
  const symbols = new Map([
    ['airix-video-core', 'AirixVideoClient'],
    ['airix-video-react', 'AirixVideoConference'],
    ['airix-video-webhooks', 'verifyAirixWebhook'],
    ['airix-video-react-native', 'useAirixNativeRoom'],
  ])
  const exports = Object.entries(plan).map(([name, version]) => {
    assert.ok(symbols.has(name), 'unknown consumer package')
    assert.match(version, /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/)
    return [name, symbols.get(name)]
  })
  const directory = await mkdtemp(join(tmpdir(), 'airix-registry-consumer-'))
  try {
    const env = { ...process.env }
    for (const key of ['NODE_AUTH_TOKEN', 'NPM_TOKEN', 'npm_config_userconfig', 'npm_config_globalconfig', 'npm_config_cache']) delete env[key]
    Object.assign(env, { NPM_CONFIG_USERCONFIG: join(directory, 'user.npmrc'), NPM_CONFIG_GLOBALCONFIG: join(directory, 'global.npmrc'), NPM_CONFIG_CACHE: join(directory, 'cache') })
    const run = (command, args) => execFileSync(command, args, { cwd: directory, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    run('npm', ['init', '-y'])
    await retryRegistryInstall(() => run('npm', ['install', '--ignore-scripts', '--prefer-online', '--registry', 'https://registry.npmjs.org', ...Object.entries(plan).map(([name, version]) => `${name}@${version}`)]))
    const output = run(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict';
      import { createRequire } from 'node:module';
      const require = createRequire(import.meta.url);
      for (const [name, symbol] of JSON.parse(process.argv[1])) {
        assert.equal(typeof (await import(name))[symbol], 'function');
        assert.equal(typeof require(name)[symbol], 'function');
      }
      console.log('Registry-only ESM/CJS consumer verified.');
    `, JSON.stringify(exports)])
    console.log(output.trim())
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await verifyConsumer(resolve(process.argv[2] ?? 'release-plan.json'))
}
