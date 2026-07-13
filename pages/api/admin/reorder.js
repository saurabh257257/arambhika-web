import { getSession } from '../../../lib/session'
import { batchUpdateSortOrder } from '../../../lib/db'

// PUT /api/admin/reorder  body: { updates: [{id, sort_order}] }
export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).end()
  const session = await getSession(req, res)
  if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })

  const { updates } = req.body
  if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates must be array' })

  batchUpdateSortOrder(updates)
  return res.status(200).json({ ok: true })
}
