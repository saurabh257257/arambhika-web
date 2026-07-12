import { getIronSession } from 'iron-session'

export const sessionOptions = {
  password: process.env.SESSION_SECRET || 'fallback_secret_change_in_production_32chars',
  cookieName: 'arambhika_admin',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
}

export async function getSession(req, res) {
  return getIronSession(req, res, sessionOptions)
}

export async function requireAdmin(req, res) {
  const session = await getSession(req, res)
  if (!session?.admin) {
    if (res.writeHead) {
      res.writeHead(302, { Location: '/admin' })
      res.end()
    }
    return null
  }
  return session
}
