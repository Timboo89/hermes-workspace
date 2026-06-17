/**
 * Direct filesystem config reader/writer for self-hosted mode.
 * Avoids HTTP self-calls by reading/writing config.yaml directly.
 */
import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'

const hermesHome =
  process.env.HERMES_HOME ||
  path.join(process.env.HOME || '/opt/data', '.hermes')
const configPath = path.join(hermesHome, 'config.yaml')

export function readLocalConfig(): Record<string, unknown> {
  try {
    const raw = fs.readFileSync(configPath, 'utf-8')
    return YAML.parse(raw) || {}
  } catch {
    return {}
  }
}

export function writeLocalConfig(config: Record<string, unknown>): void {
  fs.writeFileSync(configPath, YAML.stringify(config, { indent: 2 }), 'utf-8')
}
