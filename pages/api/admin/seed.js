import { getSession } from '../../../lib/session'
import { bulkInsertProducts } from '../../../lib/db'
import path from 'path'
import fs from 'fs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getSession(req, res)
  if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const seedPath = path.join(process.cwd(), 'lib', 'seed-data.json')
    const products = JSON.parse(fs.readFileSync(seedPath, 'utf-8'))
    const inserted = bulkInsertProducts(products)
    return res.status(200).json({ ok: true, inserted, total: products.length })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
