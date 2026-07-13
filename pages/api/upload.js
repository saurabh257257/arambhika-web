import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { getSession } from '../../lib/session'

export const config = { api: { bodyParser: false } }

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getSession(req, res)
  if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })

  ensureUploadDir()

  const form = formidable({
    uploadDir: UPLOAD_DIR,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024,
  })

  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Upload failed: ' + err.message })

    const file = files.file?.[0] || files.file
    if (!file) return res.status(400).json({ error: 'No file uploaded' })

    const ext = path.extname(file.originalFilename || '.jpg').toLowerCase() || '.jpg'

    // Auto-name: {SKU}_{slugified-name}_{index}.ext  (e.g. NPT1_nickel_strip_plated_1.jpg)
    const prefix   = Array.isArray(fields.prefix)   ? fields.prefix[0]   : (fields.prefix || '')
    const imgIndex = Array.isArray(fields.imgIndex) ? fields.imgIndex[0] : (fields.imgIndex || '1')

    let newName
    if (prefix) {
      newName = `${slugify(prefix)}_${imgIndex}${ext}`
      // Avoid overwriting: append timestamp if file exists
      if (fs.existsSync(path.join(UPLOAD_DIR, newName))) {
        newName = `${slugify(prefix)}_${imgIndex}_${Date.now()}${ext}`
      }
    } else {
      const base = slugify(path.basename(file.originalFilename || 'image', ext))
      newName = `${base}_${Date.now()}${ext}`
    }

    const newPath = path.join(UPLOAD_DIR, newName)
    fs.renameSync(file.filepath, newPath)

    const url = `/uploads/${newName}`
    return res.status(200).json({ url, name: newName })
  })
}
