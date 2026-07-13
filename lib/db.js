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
  `)

  // Migrations: add new columns to existing tables (ignore if already exist)
  const migrations = [
    `ALTER TABLE products ADD COLUMN sort_order   INTEGER DEFAULT 0`,
    `ALTER TABLE products ADD COLUMN availability TEXT DEFAULT 'in stock'`,
    `ALTER TABLE products ADD COLUMN condition    TEXT DEFAULT 'new'`,
    `ALTER TABLE products ADD COLUMN material     TEXT`,
    `ALTER TABLE products ADD COLUMN dimensions   TEXT`,
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
       sort_order, availability, condition, material, dimensions)
    VALUES
      (@name, @slug, @sku, @category, @price, @unit, @min_qty, @description, @specs, @images,
       @sort_order, @availability, @condition, @material, @dimensions)
  `).run({
    sort_order: 0, availability: 'in stock', condition: 'new', material: null, dimensions: null,
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
      material=@material, dimensions=@dimensions
    WHERE id=@id
  `).run({ ...data, id })
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
  getDb,
  getAllProducts,
  getProductBySlug,
  getProductById,
  getAllProductSlugs,
  insertProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  bulkInsertProducts,
  getAllBlogs,
  getBlogBySlug,
  getAllBlogSlugs,
  insertBlog,
  deleteBlog,
}
