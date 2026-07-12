import { getSession } from '../../../lib/session'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { username, password } = req.body
  const adminUser = process.env.ADMIN_USERNAME || 'admin'
  const adminPass = process.env.ADMIN_PASSWORD || 'changeme123'

  if (username === adminUser && password === adminPass) {
    const session = await getSession(req, res)
    session.admin = true
    await session.save()
    return res.status(200).json({ ok: true })
  }

  return res.status(401).json({ error: 'Invalid username or password' })
}
