import { getSession } from '../../../lib/session'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { getCategoriesOrdered, getCategoryNames } = require('../../../lib/db')
    const withProducts = getCategoriesOrdered()
    const allNames = getCategoryNames()
    // Merge: include category names that have no products yet
    const withProductsSet = new Set(withProducts.map(c => c.category))
    const empty = allNames.filter(n => !withProductsSet.has(n)).map(n => ({
      category: n, cat_order: 9999, product_count: 0, image: null,
    }))
    return res.status(200).json([...withProducts, ...empty])
  }

  const session = await getSession(req, res)
  if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'POST') {
    const { name } = req.body || {}
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
    const { addCategoryName } = require('../../../lib/db')
    addCategoryName(name.trim())
    return res.status(201).json({ ok: true })
  }

  if (req.method === 'PUT') {
    const { upsertCategoryOrder, upsertCategoryImage } = require('../../../lib/db')
    const { order, image } = req.body

    if (Array.isArray(order)) {
      for (let i = 0; i < order.length; i++) upsertCategoryOrder(order[i], i + 1)
      return res.status(200).json({ ok: true })
    }

    if (image?.name !== undefined) {
      upsertCategoryImage(image.name, image.url || '')
      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ error: 'Provide order array or image object' })
  }

  if (req.method === 'DELETE') {
    const { name } = req.body || {}
    if (!name) return res.status(400).json({ error: 'Name required' })
    const { deleteCategoryName } = require('../../../lib/db')
    try {
      deleteCategoryName(name)
      return res.status(200).json({ ok: true })
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  }

  res.status(405).end()
}
