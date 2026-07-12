import { getSession } from '../../../lib/session'
import { getAllProducts, insertProduct } from '../../../lib/db'

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const products = getAllProducts()
    return res.status(200).json(products)
  }

  if (req.method === 'POST') {
    const session = await getSession(req, res)
    if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })

    const { name, sku, category, price, unit, min_qty, description, specs, images } = req.body
    if (!name || !category) return res.status(400).json({ error: 'Name and category are required' })

    const slug = slugify(name)
    try {
      insertProduct({
        name,
        slug,
        sku: sku || null,
        category,
        price: price || null,
        unit: unit || 'KG',
        min_qty: min_qty || null,
        description: description || null,
        specs: JSON.stringify(specs || []),
        images: JSON.stringify(images || []),
      })
      return res.status(201).json({ ok: true, slug })
    } catch (err) {
      if (err.message?.includes('UNIQUE')) {
        return res.status(409).json({ error: 'A product with this name already exists. Please use a slightly different name.' })
      }
      return res.status(500).json({ error: err.message })
    }
  }

  res.status(405).end()
}
