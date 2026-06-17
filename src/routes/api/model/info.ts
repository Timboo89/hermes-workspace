import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import {
  deriveFallbackModelInfoFromGateway,
} from '@/lib/model-info'
import { isAuthenticated } from '../../../server/auth-middleware'
import {
  ensureGatewayProbed,
  getCapabilities,
  getGatewayMode,
} from '../../../server/gateway-capabilities'

export const Route = createFileRoute('/api/model/info')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        await ensureGatewayProbed()
        const gatewayMode = getGatewayMode()
        const resolved = deriveFallbackModelInfoFromGateway(gatewayMode, getCapabilities())

        return json({
          ...resolved,
          gatewayMode,
        })
      },
    },
  },
})
