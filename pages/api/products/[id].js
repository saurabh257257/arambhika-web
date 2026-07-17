import { getSession } from '../../../lib/session'
import { deleteProduct, updateProduct } from '../../../lib/db'

export default async function handler(req, res) {
  const session = await getSession(req, res)
  if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query

  if (req.method === 'DELETE') {
    deleteProduct(Number(id))
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'PUT') {
    const {
      name, sku, category, price, unit, min_qty, description,
      specs, images, sort_order, availability, condition, material, dimensions, brand, featured, inventory,
    } = req.body
    if (!name || !category) return res.status(400).json({ error: 'Name and category required' })
    try {
      updateProduct(Number(id), {
        name,
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
        brand: brand || 'Arambhika Enablers',
        featured: featured ? 1 : 0,
        inventory: inventory != null && inventory !== '' ? Number(inventory) : null,
      })
      return res.status(200).json({ ok: true })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  res.status(405).end()
}
