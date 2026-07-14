import { getSession } from '../../../lib/session'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { getCategoriesOrdered } = require('../../../lib/db')
    return res.status(200).json(getCategoriesOrdered())
  }

  const session = await getSession(req, res)
  if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'PUT') {
    const { upsertCategoryOrder, upsertCategoryImage } = require('../../../lib/db')
    const { order, image } = req.body

    // Reorder: { order: ['Cat A', 'Cat B', ...] }
    if (Array.isArray(order)) {
      for (let i = 0; i < order.length; i++) upsertCategoryOrder(order[i], i + 1)
      return res.status(200).json({ ok: true })
    }

    // Set image: { image: { name: 'Cat A', url: '...' } }
    if (image?.name !== undefined) {
      upsertCategoryImage(image.name, image.url || '')
      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ error: 'Provide order array or image object' })
  }

  res.status(405).end()
}
