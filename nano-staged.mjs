import { existsSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'

const lintExtensions = new Set(['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx'])
const formatExtensions = new Set([...lintExtensions, '.json', '.jsonc', '.md', '.yaml', '.yml'])
const repositoryRoot = import.meta.dirname

function findNearestConfig(file, configName) {
  let directory = dirname(file)

  while (true) {
    const config = join(directory, configName)

    if (existsSync(config)) return config

    if (directory === repositoryRoot) return undefined

    const parent = dirname(directory)
    if (parent === directory) return undefined

    directory = parent
  }
}

function quote(value) {
  return `"${value}"`
}

function createCommands(filenames, { command, configName, extensions }) {
  const groups = new Map()

  for (const file of filenames) {
    if (!extensions.has(extname(file))) continue

    const config = findNearestConfig(file, configName)
    if (!config) continue

    const files = groups.get(config) ?? []
    files.push(file)
    groups.set(config, files)
  }

  return [...groups].map(
    ([config, files]) =>
      `${command} -c ${quote(config)} ${files.map((file) => quote(file)).join(' ')}`,
  )
}

export default ({ filenames }) => [
  ...createCommands(filenames, {
    command: 'oxlint --fix --no-error-on-unmatched-pattern',
    configName: '.oxlintrc.json',
    extensions: lintExtensions,
  }),
  ...createCommands(filenames, {
    command: 'oxfmt --write --no-error-on-unmatched-pattern',
    configName: '.oxfmtrc.json',
    extensions: formatExtensions,
  }),
]
