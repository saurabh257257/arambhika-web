import { getSession } from '../../../lib/session'

export default async function handler(req, res) {
  const session = await getSession(req, res)
  session.destroy()
  res.writeHead(302, { Location: '/admin' })
  res.end()
}
