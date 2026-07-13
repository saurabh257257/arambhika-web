import { getSession } from '../../../lib/session'
import { upsertCategoryOrder, getCategoriesOrdered } from '../../../lib/db'

// PUT /api/admin/categories  body: { order: ['Cat A', 'Cat B', ...] }
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const cats = getCategoriesOrdered()
    return res.status(200).json(cats)
  }

  if (req.method === 'PUT') {
    const session = await getSession(req, res)
    if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })

    const { order } = req.body
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be array' })

    for (let i = 0; i < order.length; i++) {
      upsertCategoryOrder(order[i], i + 1)
    }
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
