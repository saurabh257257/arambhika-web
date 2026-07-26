import { getSession } from '../../../lib/session'
import { setProductAvailability } from '../../../lib/db'

export default async function handler(req, res) {
  const session = await getSession(req, res)
  if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'PUT') {
    const { id, availability } = req.body
    if (!id) return res.status(400).json({ error: 'id required' })
    const valid = ['in stock', 'Available on Request']
    if (!valid.includes(availability)) return res.status(400).json({ error: 'invalid availability' })
    setProductAvailability(Number(id), availability)
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
