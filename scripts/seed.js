#!/usr/bin/env node
// One-time seed script — run after deploy to import products from Excel template.
// Uses INSERT OR IGNORE so re-running is safe (no duplicates).

const path = require('path')
process.chdir(path.join(__dirname, '..'))

const { bulkInsertProducts } = require('../lib/db')
const fs = require('fs')

const seedPath = path.join(__dirname, '..', 'lib', 'seed-data.json')
const products = JSON.parse(fs.readFileSync(seedPath, 'utf-8'))

const inserted = bulkInsertProducts(products)
console.log(`[seed] Inserted ${inserted} new products out of ${products.length} total.`)
