#!/usr/bin/env node
// One-time seed: wipe all existing products and insert fresh from seed-data.json

const path = require('path')
process.chdir(path.join(__dirname, '..'))

const db = require('../lib/db').getDb()
const fs = require('fs')

const products = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'lib', 'seed-data.json'), 'utf-8')
)

// Wipe everything
db.exec('DELETE FROM products')
console.log('[seed] Cleared all existing products.')

function slugify(text) {
  return text.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const usedSlugs = {}
function uniqueSlug(base) {
  let s = base, n = 2
  while (usedSlugs[s]) { s = base + '-' + n++ }
  usedSlugs[s] = true
  return s
}

const stmt = db.prepare(`
  INSERT INTO products
    (name, slug, sku, category, price, unit, min_qty, description, specs, images,
     sort_order, availability, condition, material, dimensions)
  VALUES
    (@name, @slug, @sku, @category, @price, @unit, @min_qty, @description, @specs, @images,
     @sort_order, @availability, @condition, @material, @dimensions)
`)

const insertAll = db.transaction((rows) => {
  for (const p of rows) {
    const slug = uniqueSlug(slugify((p.sku || '') + '-' + p.name))
    stmt.run({
      sort_order: 0, availability: 'in stock', condition: 'new', material: null, dimensions: null,
      ...p, slug,
    })
  }
})

insertAll(products)
console.log(`[seed] Inserted ${products.length} products.`)
