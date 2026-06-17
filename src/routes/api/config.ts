/**
 * Config route at /api/config — required by probeMcpConfigKey() during
 * the initial gateway probe (dashboardFetch → getConfig → /api/config).
 *
 * Unlike /api/claude-config (which guards on capabilities.config), this
 * route always reads the YAML directly — avoiding the circular dependency
 * where the probe needs config but config needs the probe to complete.
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'
import { isAuthenticated } from '../../server/auth-middleware'

export const Route = createFileRoute('/api/config')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }
        const hermesHome = process.env.HERMES_HOME ||
          path.join(process.env.HOME || '/opt/data', '.hermes')
        const configPath = path.join(hermesHome, 'config.yaml')
        try {
          const raw = fs.readFileSync(configPath, 'utf-8')
          const config = YAML.parse(raw) || {}
          return json({ ok: true, config })
        } catch {
          return json({ ok: true, config: {} })
        }
      },
      PATCH: async ({ request }) => {
        // Forward PATCH to the full handler
        const { handleHermesConfigPatch } = await import(
          '../../server/hermes-config-route'
        )
        return handleHermesConfigPatch({ request })
      },
    },
  },
})
