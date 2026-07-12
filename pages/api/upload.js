import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { getSession } from '../../lib/session'

export const config = { api: { bodyParser: false } }

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getSession(req, res)
  if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })

  ensureUploadDir()

  const form = formidable({
    uploadDir: UPLOAD_DIR,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  })

  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Upload failed: ' + err.message })

    const file = files.file?.[0] || files.file
    if (!file) return res.status(400).json({ error: 'No file uploaded' })

    // Rename to something clean
    const ext = path.extname(file.originalFilename || '.jpg')
    const base = sanitizeFilename(path.basename(file.originalFilename || 'image', ext))
    const timestamp = Date.now()
    const newName = `${base}-${timestamp}${ext}`
    const newPath = path.join(UPLOAD_DIR, newName)

    fs.renameSync(file.filepath, newPath)

    const siteUrl = process.env.SITE_URL || 'http://localhost:3000'
    const url = `/uploads/${newName}`

    return res.status(200).json({
      url,
      fullUrl: `${siteUrl}${url}`,
    })
  })
}
