/**
 * Brings up the stack under test: the Page, built as it is for deployment and served
 * statically, and a juicebox-mcp Worker under `wrangler dev`, from the checkout JUICEBOX_MCP
 * names (by default ../juicebox-mcp, beside this repo).
 */
import { spawn, execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { PAGE_URL, WORKER_URL } from './addresses.js'

const REPO_ROOT = join(import.meta.dirname, '..')

/** The juicebox-mcp checkout whose Worker the Page joins. */
const JUICEBOX_MCP = resolve(REPO_ROOT, process.env.JUICEBOX_MCP ?? '../juicebox-mcp')

/** How long the Page or the Worker may take to answer once started, in milliseconds. */
const START_TIMEOUT = 60_000

/**
 * @param {string} url
 * @returns {Promise<boolean>}
 */
async function listening(url) {
  try {
    await fetch(url)
    return true
  } catch {
    return false
  }
}

/**
 * Starts a process and waits until `url` answers.
 *
 * @param {string} name what the process is, for errors
 * @param {string} url where it answers once started
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {Promise<import('node:child_process').ChildProcess>}
 */
async function start(name, url, command, args, cwd, env = process.env) {
  if (await listening(url)) throw new Error(`${url} is already in use; the round trip needs it for ${name}`)
  let output = ''
  const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', (chunk) => (output += chunk))
  child.stderr.on('data', (chunk) => (output += chunk))

  const deadline = Date.now() + START_TIMEOUT
  while (!(await listening(url))) {
    if (child.exitCode !== null || Date.now() > deadline) {
      child.kill()
      throw new Error(`${name} did not start at ${url}:\n${output}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  return child
}

export default async function setup() {
  const server = join(JUICEBOX_MCP, 'packages', 'server')
  if (!existsSync(join(server, 'wrangler.toml'))) {
    throw new Error(`No juicebox-mcp checkout at ${JUICEBOX_MCP}; set JUICEBOX_MCP to one (see the README)`)
  }

  const scratch = mkdtempSync(join(tmpdir(), 'juicebox-view-roundtrip-'))
  const dist = join(scratch, 'dist')
  const port = (url) => new URL(url).port

  // Vite inlines VITE_WS_URL at build time: this Page joins its Room on the Worker started below,
  // directly, as a deployed Page does. Vitest sets NODE_ENV to test, which would build the Page
  // with import.meta.env.DEV true and so with the dev proxy's URL mapper.
  execFileSync('npx', ['vite', 'build', '--outDir', dist], {
    cwd: REPO_ROOT,
    env: { ...process.env, NODE_ENV: 'production', VITE_WS_URL: `${WORKER_URL.replace('http', 'ws')}/ws` },
    stdio: 'pipe',
  })

  const children = []
  const stop = () => {
    for (const child of children) child.kill()
    rmSync(scratch, { recursive: true, force: true })
  }
  try {
    // BROWSER=none: vite.config.js opens a browser, and preview follows it.
    children.push(
      await start('the Page', PAGE_URL, 'npx', ['vite', 'preview', '--outDir', dist, '--port', port(PAGE_URL), '--strictPort'], REPO_ROOT, { ...process.env, BROWSER: 'none' }),
    )
    children.push(
      await start(
        'the Worker',
        WORKER_URL,
        'npx',
        [
          'wrangler', 'dev',
          '--port', port(WORKER_URL),
          '--inspector-port', '0',
          '--show-interactive-dev-session=false',
          // Rooms and MCP sessions are kept in the scratch directory, not in the checkout.
          '--persist-to', join(scratch, 'state'),
          // Join links point at this Page. The Worker reads ALLOWED_ORIGINS with includes(); given
          // on the command line it is a string rather than wrangler.toml's list, which admits
          // this Page's origin all the same.
          '--var', `BROWSER_URL:${PAGE_URL}/`,
          '--var', `ALLOWED_ORIGINS:${JSON.stringify([PAGE_URL])}`,
        ],
        server,
      ),
    )
  } catch (error) {
    stop()
    throw error
  }

  return stop
}
