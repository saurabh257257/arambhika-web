import { getSession } from '../../../lib/session'
import { deleteBlog } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end()
  const session = await getSession(req, res)
  if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })

  deleteBlog(Number(req.query.id))
  return res.status(200).json({ ok: true })
}
