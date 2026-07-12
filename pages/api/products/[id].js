import { getSession } from '../../../lib/session'
import { deleteProduct } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end()
  const session = await getSession(req, res)
  if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  deleteProduct(Number(id))
  return res.status(200).json({ ok: true })
}
