import { getSession } from '../../../lib/session'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { getSettings } = require('../../../lib/db')
    return res.status(200).json(getSettings())
  }

  if (req.method === 'PUT') {
    const session = await getSession(req, res)
    if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })
    const { upsertSettings } = require('../../../lib/db')
    if (typeof req.body !== 'object') return res.status(400).json({ error: 'Invalid body' })
    upsertSettings(req.body)
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
