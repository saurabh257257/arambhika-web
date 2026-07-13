import { getSession } from '../../../lib/session'
import { getAllProducts, insertProduct } from '../../../lib/db'

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const products = getAllProducts()
    return res.status(200).json(products)
  }

  if (req.method === 'POST') {
    const session = await getSession(req, res)
    if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })

    const {
      name, sku, category, price, unit, min_qty, description,
      specs, images, sort_order, availability, condition, material, dimensions,
    } = req.body
    if (!name || !category) return res.status(400).json({ error: 'Name and category are required' })

    const baseSlug = slugify(sku ? `${sku}-${name}` : name)
    let slug = baseSlug
    let attempt = 2
    // Try unique slug
    const { getDb } = require('../../../lib/db')
    const db = getDb()
    while (db.prepare('SELECT id FROM products WHERE slug=?').get(slug)) {
      slug = `${baseSlug}-${attempt++}`
    }

    try {
      const result = insertProduct({
        name, slug,
        sku: sku || null,
        category,
        price: price || null,
        unit: unit || 'KG',
        min_qty: min_qty || null,
        description: description || null,
        specs: JSON.stringify(specs || []),
        images: JSON.stringify(images || []),
        sort_order: Number(sort_order) || 0,
        availability: availability || 'in stock',
        condition: condition || 'new',
        material: material || null,
        dimensions: dimensions || null,
      })
      return res.status(201).json({ ok: true, id: result.lastInsertRowid, slug })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  res.status(405).end()
}
