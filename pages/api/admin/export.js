import { getSession } from '../../../lib/session'
import { getAllProductsAdmin } from '../../../lib/db'

function escCsv(v) {
  if (v == null) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

export default async function handler(req, res) {
  const session = await getSession(req, res)
  if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method !== 'GET') return res.status(405).end()

  const all = getAllProductsAdmin()
  // Only export visible (non-hidden) products
  const products = all.filter(p => !p.hidden)

  const headers = ['SKU', 'Name', 'Category', 'Price', 'Unit', 'Min Qty', 'Inventory', 'Availability', 'Description']
  const rows = products.map(p => [
    p.sku, p.name, p.category, p.price, p.unit, p.min_qty,
    p.inventory ?? '', p.availability, p.description,
  ])

  const csv = [headers, ...rows].map(r => r.map(escCsv).join(',')).join('\r\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="arambhika-products-${new Date().toISOString().slice(0,10)}.csv"`)
  res.status(200).send('﻿' + csv) // BOM for Excel UTF-8
}
