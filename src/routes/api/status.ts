import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/status')({
  server: {
    handlers: {
      GET: async () => {
        return json({ version: '2.3.0', ok: true })
      },
    },
  },
})
