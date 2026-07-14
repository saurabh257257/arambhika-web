const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'arambhika.db')

let _db = null

function getDb() {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  initSchema(_db)
  return _db
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL,
      slug         TEXT UNIQUE NOT NULL,
      sku          TEXT,
      category     TEXT NOT NULL,
      price        TEXT,
      unit         TEXT,
      min_qty      TEXT,
      description  TEXT,
      specs        TEXT DEFAULT '[]',
      images       TEXT DEFAULT '[]',
      sort_order   INTEGER DEFAULT 0,
      availability TEXT DEFAULT 'in stock',
      condition    TEXT DEFAULT 'new',
      material     TEXT,
      dimensions   TEXT,
      active       INTEGER DEFAULT 1,
      created_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blogs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT NOT NULL,
      slug         TEXT UNIQUE NOT NULL,
      excerpt      TEXT,
      content      TEXT,
      cover_image  TEXT,
      published_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );
  `)

  // Seed default settings (INSERT OR IGNORE so existing values are never overwritten)
  const defaults = [
    ['brand_name',      'Arambhika Enablers'],
    ['brand_tagline',   'Nickel & Copper Battery Connectors: Mfg. & Dist.'],
    ['brand_logo',      ''],
    ['wa_number',       '919315545821'],
    ['phone1',          '+91-9315545821'],
    ['phone2',          '+91-8112662827'],
    ['phone3',          '+91-9953255677'],
    ['email',           'info@arambhikaenablers.in'],
    ['address',         'Plot No. C-03, Sector 4, Greater Noida, UP – 201318'],
    ['hero_title',      'Nickel Strips & Copper Busbars for Battery Manufacturers'],
    ['hero_subtitle',   'Manufacturer and distributor based in Greater Noida. Serving EV, ESS, and battery pack makers across India.'],
    ['hero_cta',        'Browse Products'],
    ['cta_title',       'Need a custom quote?'],
    ['cta_subtitle',    'Send us your specifications on WhatsApp — we\'ll respond within 2 hours.'],
    ['about_heading',   'About Arambhika Enablers'],
    ['about_content',   'We are a manufacturer and distributor of nickel strips, copper busbars, and battery interconnect components based in Greater Noida, serving EV and ESS manufacturers across India.'],
    ['site_title',       'Arambhika Enablers — Nickel Strip & Copper Busbar Manufacturer India'],
    ['meta_description','Manufacturer and distributor of nickel strips, copper busbars, and battery connectors. Based in Greater Noida. Serving EV, ESS, and battery pack manufacturers across India.'],
  ]
  const ins = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`)
  for (const [k, v] of defaults) ins.run(k, v)

  // Migrations: add new columns to existing tables (ignore if already exist)
  const migrations = [
    `ALTER TABLE products ADD COLUMN sort_order   INTEGER DEFAULT 0`,
    `ALTER TABLE products ADD COLUMN availability TEXT DEFAULT 'in stock'`,
    `ALTER TABLE products ADD COLUMN condition    TEXT DEFAULT 'new'`,
    `ALTER TABLE products ADD COLUMN material     TEXT`,
    `ALTER TABLE products ADD COLUMN dimensions   TEXT`,
    `ALTER TABLE products ADD COLUMN brand        TEXT DEFAULT 'Arambhika Enablers'`,
    `ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0`,
  ]
  for (const sql of migrations) {
    try { db.exec(sql) } catch (_) { /* column already exists */ }
  }
}

// ── Products ─────────────────────────────────────────────────────────────────

function getAllProducts(category = null) {
  const db = getDb()
  if (category) {
    return db.prepare(
      'SELECT * FROM products WHERE active=1 AND category=? ORDER BY sort_order ASC, created_at ASC'
    ).all(category)
  }
  return db.prepare(
    'SELECT * FROM products WHERE active=1 ORDER BY category, sort_order ASC, created_at ASC'
  ).all()
}

function getProductBySlug(slug) {
  const db = getDb()
  return db.prepare('SELECT * FROM products WHERE slug=? AND active=1').get(slug)
}

function getProductById(id) {
  const db = getDb()
  return db.prepare('SELECT * FROM products WHERE id=?').get(id)
}

function getAllProductSlugs() {
  const db = getDb()
  return db.prepare('SELECT slug FROM products WHERE active=1').all()
}

function insertProduct(data) {
  const db = getDb()
  return db.prepare(`
    INSERT INTO products
      (name, slug, sku, category, price, unit, min_qty, description, specs, images,
       sort_order, availability, condition, material, dimensions, brand)
    VALUES
      (@name, @slug, @sku, @category, @price, @unit, @min_qty, @description, @specs, @images,
       @sort_order, @availability, @condition, @material, @dimensions, @brand)
  `).run({
    sort_order: 0, availability: 'in stock', condition: 'new',
    material: null, dimensions: null, brand: 'Arambhika Enablers',
    ...data,
  })
}

function updateProduct(id, data) {
  const db = getDb()
  return db.prepare(`
    UPDATE products SET
      name=@name, sku=@sku, category=@category, price=@price, unit=@unit,
      min_qty=@min_qty, description=@description, specs=@specs, images=@images,
      sort_order=@sort_order, availability=@availability, condition=@condition,
      material=@material, dimensions=@dimensions, brand=@brand
    WHERE id=@id
  `).run({ brand: 'Arambhika Enablers', ...data, id })
}

function batchUpdateSortOrder(updates) {
  // updates: [{ id, sort_order }, ...]
  const db = getDb()
  const stmt = db.prepare('UPDATE products SET sort_order=@sort_order WHERE id=@id')
  const run = db.transaction((rows) => { for (const r of rows) stmt.run(r) })
  run(updates)
}

function getCategoriesOrdered() {
  const db = getDb()
  // Return distinct categories ordered by the categories.sort_order table, then name
  return db.prepare(`
    SELECT p.category,
           COALESCE(c.sort_order, 9999) AS cat_order,
           COUNT(*) AS product_count
    FROM products p
    LEFT JOIN categories c ON c.name = p.category
    WHERE p.active = 1
    GROUP BY p.category
    ORDER BY cat_order ASC, p.category ASC
  `).all()
}

function upsertCategoryOrder(name, sort_order) {
  const db = getDb()
  db.prepare(`
    INSERT INTO categories (name, sort_order) VALUES (@name, @sort_order)
    ON CONFLICT(name) DO UPDATE SET sort_order = @sort_order
  `).run({ name, sort_order })
}

function deleteProduct(id) {
  const db = getDb()
  return db.prepare('UPDATE products SET active=0 WHERE id=?').run(id)
}

function getCategories() {
  const db = getDb()
  return db.prepare(
    'SELECT DISTINCT category FROM products WHERE active=1 ORDER BY category'
  ).all()
}

function getAllProductsSorted() {
  const db = getDb()
  return db.prepare(`
    SELECT p.*,
           COALESCE(c.sort_order, 9999) AS cat_order
    FROM products p
    LEFT JOIN categories c ON c.name = p.category
    WHERE p.active = 1
    ORDER BY cat_order ASC, p.category ASC, p.sort_order ASC, p.created_at ASC
  `).all()
}

function bulkInsertProducts(products) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO products
      (name, slug, sku, category, price, unit, min_qty, description, specs, images,
       sort_order, availability, condition, material, dimensions)
    VALUES
      (@name, @slug, @sku, @category, @price, @unit, @min_qty, @description, @specs, @images,
       @sort_order, @availability, @condition, @material, @dimensions)
  `)
  const insertMany = db.transaction((rows) => {
    let inserted = 0
    for (const p of rows) {
      const r = stmt.run({
        sort_order: 0, availability: 'in stock', condition: 'new', material: null, dimensions: null,
        ...p,
      })
      if (r.changes) inserted++
    }
    return inserted
  })
  return insertMany(products)
}

// ── Settings ──────────────────────────────────────────────────────────────────

function getSettings() {
  const db = getDb()
  const rows = db.prepare('SELECT key, value FROM settings').all()
  return Object.fromEntries(rows.map(r => [r.key, r.value]))
}

function upsertSettings(kvMap) {
  const db = getDb()
  const stmt = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`)
  const run = db.transaction((map) => {
    for (const [k, v] of Object.entries(map)) stmt.run(k, String(v ?? ''))
  })
  run(kvMap)
}

// ── Blogs ─────────────────────────────────────────────────────────────────────

function getAllBlogs() {
  const db = getDb()
  return db.prepare('SELECT * FROM blogs ORDER BY published_at DESC').all()
}

function getBlogBySlug(slug) {
  const db = getDb()
  return db.prepare('SELECT * FROM blogs WHERE slug=?').get(slug)
}

function getAllBlogSlugs() {
  const db = getDb()
  return db.prepare('SELECT slug FROM blogs').all()
}

function insertBlog(data) {
  const db = getDb()
  return db.prepare(`
    INSERT INTO blogs (title, slug, excerpt, content, cover_image)
    VALUES (@title, @slug, @excerpt, @content, @cover_image)
  `).run(data)
}

function deleteBlog(id) {
  const db = getDb()
  return db.prepare('DELETE FROM blogs WHERE id=?').run(id)
}

module.exports = {
  getSettings,
  upsertSettings,
  getDb,
  getAllProducts,
  getAllProductsSorted,
  getProductBySlug,
  getProductById,
  getAllProductSlugs,
  insertProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  bulkInsertProducts,
  batchUpdateSortOrder,
  getCategoriesOrdered,
  upsertCategoryOrder,
  getAllBlogs,
  getBlogBySlug,
  getAllBlogSlugs,
  insertBlog,
  deleteBlog,
}
