import { getSession } from '../../../lib/session'
import { updateInventory } from '../../../lib/db'

export default async function handler(req, res) {
  const session = await getSession(req, res)
  if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'PUT') {
    const { id, inventory } = req.body
    if (!id) return res.status(400).json({ error: 'id required' })

    const inv = inventory === '' || inventory == null ? null : Number(inventory)
    // Auto-derive availability label
    const availability = inv === 0 ? 'Available on Request' : 'in stock'

    try {
      updateInventory(Number(id), inv, availability)
      return res.status(200).json({ ok: true, availability })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  res.status(405).end()
}
