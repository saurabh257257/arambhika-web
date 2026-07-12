const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

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
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      slug       TEXT UNIQUE NOT NULL,
      sku        TEXT,
      category   TEXT NOT NULL,
      price      TEXT,
      unit       TEXT,
      min_qty    TEXT,
      description TEXT,
      specs      TEXT DEFAULT '[]',
      images     TEXT DEFAULT '[]',
      active     INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
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
}

// Products
function getAllProducts(category = null) {
  const db = getDb()
  if (category) {
    return db.prepare('SELECT * FROM products WHERE active=1 AND category=? ORDER BY created_at DESC').all(category)
  }
  return db.prepare('SELECT * FROM products WHERE active=1 ORDER BY category, created_at DESC').all()
}

function getProductBySlug(slug) {
  const db = getDb()
  return db.prepare('SELECT * FROM products WHERE slug=? AND active=1').get(slug)
}

function getAllProductSlugs() {
  const db = getDb()
  return db.prepare('SELECT slug FROM products WHERE active=1').all()
}

function insertProduct(data) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO products (name, slug, sku, category, price, unit, min_qty, description, specs, images)
    VALUES (@name, @slug, @sku, @category, @price, @unit, @min_qty, @description, @specs, @images)
  `)
  return stmt.run(data)
}

function deleteProduct(id) {
  const db = getDb()
  return db.prepare('UPDATE products SET active=0 WHERE id=?').run(id)
}

function getCategories() {
  const db = getDb()
  return db.prepare('SELECT DISTINCT category FROM products WHERE active=1 ORDER BY category').all()
}

// Blogs
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
  const stmt = db.prepare(`
    INSERT INTO blogs (title, slug, excerpt, content, cover_image)
    VALUES (@title, @slug, @excerpt, @content, @cover_image)
  `)
  return stmt.run(data)
}

function deleteBlog(id) {
  const db = getDb()
  return db.prepare('DELETE FROM blogs WHERE id=?').run(id)
}

module.exports = {
  getDb,
  getAllProducts,
  getProductBySlug,
  getAllProductSlugs,
  insertProduct,
  deleteProduct,
  getCategories,
  getAllBlogs,
  getBlogBySlug,
  getAllBlogSlugs,
  insertBlog,
  deleteBlog,
}
