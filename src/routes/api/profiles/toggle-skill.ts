/**
 * Per-profile skill toggle — local implementation for self-hosted mode.
 * PUT /api/profiles/toggle-skill
 *   body: { profile: string, name: string, enabled: boolean }
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { parse, stringify } from 'yaml'

const HERMES_HOME = process.env.HOME || '/opt/data'
const PROFILE_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/

function configPathForProfile(profile: string): string {
  if (profile === 'default') {
    return resolve(HERMES_HOME, '.hermes/config.yaml')
  }
  return resolve(HERMES_HOME, `.hermes/profiles/${profile}/config.yaml`)
}

export const Route = createFileRoute('/api/profiles/toggle-skill')({
  server: {
    handlers: {
      PUT: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        try {
          const body = (await request.json()) as {
            profile?: string
            name?: string
            enabled?: boolean
          }
          const profile = (body.profile || '').trim()
          const name = (body.name || '').trim()
          const enabled = Boolean(body.enabled)

          if (!profile || !PROFILE_NAME_RE.test(profile)) {
            return json({ ok: false, error: 'A valid profile name is required' }, { status: 400 })
          }
          if (!name) {
            return json({ ok: false, error: 'A skill name is required' }, { status: 400 })
          }

          const configPath = configPathForProfile(profile)
          let config: Record<string, unknown> = {}
          try {
            config = parse(readFileSync(configPath, 'utf-8')) || {}
          } catch {
            // File doesn't exist yet — start fresh
          }

          const skills = (config.skills || {}) as Record<string, unknown>
          const disabled = new Set<string>((skills.disabled as string[]) || [])

          if (enabled) {
            disabled.delete(name)
          } else {
            disabled.add(name)
          }

          skills.disabled = [...disabled].sort()
          config.skills = skills
          writeFileSync(configPath, stringify(config, { lineWidth: 120 }), 'utf-8')

          return json({ ok: true, name, enabled })
        } catch (err) {
          return json(
            { ok: false, error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
          )
        }
      },
    },
  },
})
