import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { parse, stringify } from 'yaml'

const CONFIG_PATH = resolve(process.env.HOME || '/opt/data', '.hermes/config.yaml')

function loadConfig(): Record<string, unknown> {
  try {
    return parse(readFileSync(CONFIG_PATH, 'utf-8')) || {}
  } catch {
    return {}
  }
}

function saveConfig(config: Record<string, unknown>) {
  writeFileSync(CONFIG_PATH, stringify(config, { lineWidth: 120 }), 'utf-8')
}

export const Route = createFileRoute('/api/skills/toggle')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        try {
          const body = (await request.json()) as {
            skillId?: string
            name?: string
            enabled?: boolean
          }
          const name = (body.name || body.skillId || '').trim()
          if (!name) {
            return json({ ok: false, error: 'name or skillId required' }, { status: 400 })
          }
          if (typeof body.enabled !== 'boolean') {
            return json({ ok: false, error: 'enabled (boolean) required' }, { status: 400 })
          }

          const config = loadConfig()
          const skills = (config.skills || {}) as Record<string, unknown>
          const disabled = new Set<string>((skills.disabled as string[]) || [])

          if (body.enabled) {
            disabled.delete(name)
          } else {
            disabled.add(name)
          }

          skills.disabled = [...disabled].sort()
          config.skills = skills
          saveConfig(config)

          return json({ ok: true, name, enabled: body.enabled })
        } catch (error) {
          return json(
            { ok: false, error: error instanceof Error ? error.message : 'Failed to toggle skill' },
            { status: 500 },
          )
        }
      },
    },
  },
})
