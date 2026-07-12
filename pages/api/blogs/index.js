import { getSession } from '../../../lib/session'
import { getAllBlogs, insertBlog } from '../../../lib/db'

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(getAllBlogs())
  }

  if (req.method === 'POST') {
    const session = await getSession(req, res)
    if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })

    const { title, excerpt, content, cover_image } = req.body
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' })

    const slug = slugify(title)
    try {
      insertBlog({ title, slug, excerpt: excerpt || null, content, cover_image: cover_image || null })
      return res.status(201).json({ ok: true, slug })
    } catch (err) {
      if (err.message?.includes('UNIQUE')) {
        return res.status(409).json({ error: 'A post with this title already exists.' })
      }
      return res.status(500).json({ error: err.message })
    }
  }

  res.status(405).end()
}
