import { getSession } from '../../../lib/session'
import { getAllProductsAdmin, getSettings } from '../../../lib/db'

function esc(v) {
  if (v == null) return ''
  const s = String(v).replace(/\r?\n/g, ' ')
  if (s.includes(',') || s.includes('"')) return `"${s.replace(/"/g, '""')}"`
  return s
}

function fmtPrice(price) {
  if (!price) return ''
  const num = parseFloat(String(price).replace(/[^\d.]/g, ''))
  return isNaN(num) ? '' : `${num.toFixed(2)} INR`
}

function availMap(a) {
  return a === 'out of stock' ? 'out of stock' : 'in stock'
}

export default async function handler(req, res) {
  const session = await getSession(req, res)
  if (!session?.admin) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method !== 'GET') return res.status(405).end()

  const settings = getSettings()
  const siteUrl  = process.env.SITE_URL || 'https://arambhikaenablers.in'
  const brand    = settings.brand_name || 'Arambhika Enablers'

  const products = getAllProductsAdmin().filter(p => !p.hidden)

  const COLS = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand']

  const rows = products.map(p => {
    const images = JSON.parse(p.images || '[]')
    const specs  = JSON.parse(p.specs  || '[]')

    let desc = p.description || p.name
    if (specs.length) desc += '. ' + specs.map(s => `${s.key}: ${s.value}`).join('; ')
    if (p.unit)    desc += `. Unit: ${p.unit}`
    if (p.min_qty) desc += `. Min Qty: ${p.min_qty} ${p.unit || ''}`

    return [
      p.sku || p.slug,
      p.name.slice(0, 200),
      desc.slice(0, 9999),
      availMap(p.availability),
      p.condition || 'new',
      fmtPrice(p.price),
      `${siteUrl}/store/${p.slug}`,
      images[0] || '',
      p.brand || brand,
    ]
  })

  const csv = [COLS, ...rows].map(r => r.map(esc).join(',')).join('\r\n')
  const date = new Date().toISOString().slice(0, 10)

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="whatsapp-catalog-${date}.csv"`)
  res.status(200).send('﻿' + csv)
}
