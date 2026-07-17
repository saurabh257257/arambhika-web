import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { getSession } from '../../../lib/session'

const UNITS = ['KG','Piece','Meter','Roll','Box','Set']

let _tempId = -1
function newTempId() { return _tempId-- }

function slugifyPrefix(sku, name) {
  const raw = (sku ? sku + '_' : '') + name
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 50)
}

function initRow(p) {
  return {
    ...p,
    specs:        typeof p.specs  === 'string' ? JSON.parse(p.specs  || '[]') : (p.specs  || []),
    images:       typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || []),
    sort_order:   p.sort_order   ?? 0,
    availability: p.availability || 'in stock',
    condition:    p.condition    || 'new',
    brand:        p.brand        || 'Arambhika Enablers',
    material:     p.material     || '',
    dimensions:   p.dimensions   || '',
    featured:     p.featured     ?? 0,
    inventory:    p.inventory    ?? '',
    _dirty: false, _saving: false, _open: false, _isNew: false,
  }
}

// ── Image Manager ─────────────────────────────────────────────────────────────
function ImageManager({ images, onChange, sku, productName }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    const prefix = slugifyPrefix(sku, productName || 'product')
    let idx = images.length + 1
    const newUrls = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('prefix', prefix)
      fd.append('imgIndex', String(idx++))
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await r.json()
      if (r.ok) newUrls.push(d.url)
    }
    onChange([...images, ...newUrls])
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div className="ap-img-manager">
      <div className="ap-img-grid">
        {images.map((url, i) => (
          <div key={i} className="ap-img-item">
            <img src={url} alt={`img ${i + 1}`} />
            <button className="ap-img-remove" onClick={() => onChange(images.filter((_, n) => n !== i))}>✕</button>
            <span className="ap-img-num">{i + 1}</span>
          </div>
        ))}
        <input type="file" ref={fileRef} accept="image/*" multiple style={{ display: 'none' }} onChange={upload} />
        <button className="ap-img-add" onClick={() => fileRef.current.click()} disabled={uploading}>
          {uploading ? '⏳' : '+ Add\nimage'}
        </button>
      </div>
    </div>
  )
}

// ── Specs Editor ──────────────────────────────────────────────────────────────
function SpecsEditor({ specs, onChange }) {
  const upd = (i, field, val) =>
    onChange(specs.map((s, n) => n === i ? { ...s, [field]: val } : s))
  return (
    <div>
      {specs.map((s, i) => (
        <div key={i} className="ap-spec-row">
          <input className="ap-field" value={s.key} onChange={e => upd(i, 'key', e.target.value)} placeholder="Property (e.g. Width)" />
          <span style={{ color: 'var(--muted)', padding: '0 4px' }}>→</span>
          <input className="ap-field" value={s.value} onChange={e => upd(i, 'value', e.target.value)} placeholder="Value (e.g. 6 mm)" />
          <button className="ap-del-spec" onClick={() => onChange(specs.filter((_, n) => n !== i))}>✕</button>
        </div>
      ))}
      <button className="ap-add-spec" onClick={() => onChange([...specs, { key: '', value: '' }])}>+ Add specification</button>
    </div>
  )
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ row, onUpdate, onSave, onDelete, onMoveUp, onMoveDown, isFirst, isLast, siteUrl, allCategories }) {
  const f = (field, val) => onUpdate(row.id, { [field]: val, _dirty: true })
  const firstImg = row.images[0]
  const invNum = row.inventory === '' || row.inventory == null ? null : Number(row.inventory)
  const isOOS = invNum === 0

  return (
    <div className={`ap-card${row._isNew ? ' ap-card-new' : ''}${row._open ? ' ap-card-open' : ''}`}>

      {/* ── Compact summary row ── */}
      <div className="ap-summary" onClick={() => onUpdate(row.id, { _open: !row._open })}>
        <div className="ap-summary-img">
          {firstImg
            ? <img src={firstImg} alt="" />
            : <div className="ap-no-img">📷</div>}
        </div>
        <div className="ap-summary-info">
          <div className="ap-summary-name">{row.name || <em style={{ color: 'var(--muted)' }}>Untitled product</em>}</div>
          <div className="ap-summary-meta">
            {row.sku && <span className="ap-meta-tag">#{row.sku}</span>}
            {row.category && <span className="ap-meta-tag">{row.category}</span>}
            {row.price && <span className="ap-meta-tag">₹{row.price}/{row.unit || 'KG'}</span>}
            {invNum != null ? (
              <span className={`ap-meta-tag ${isOOS ? 'ap-oos' : 'ap-instock'}`}>
                {isOOS ? '⚠ Out of Stock' : `✓ ${invNum} in stock`}
              </span>
            ) : (
              <span className="ap-meta-tag" style={{ color: 'var(--muted)' }}>{row.availability}</span>
            )}
          </div>
        </div>
        <div className="ap-summary-actions" onClick={e => e.stopPropagation()}>
          <div className="ap-reorder-btns">
            <button className="ap-move-btn" disabled={isFirst} onClick={onMoveUp} title="Move up">▲</button>
            <button className="ap-move-btn" disabled={isLast}  onClick={onMoveDown} title="Move down">▼</button>
          </div>
          {!row._isNew && row.slug && (
            <a href={`${siteUrl}/store/${row.slug}`} target="_blank" rel="noopener noreferrer"
               className="ap-view-btn" title="View on site">↗</a>
          )}
          <button className="ap-save-btn" disabled={!row._dirty || row._saving} onClick={() => onSave(row.id)}>
            {row._saving ? '…' : row._dirty ? '💾 Save' : '✓ Saved'}
          </button>
          <button className="ap-del-btn" onClick={() => onDelete(row.id)}>✕</button>
          <button className="ap-toggle-btn" onClick={() => onUpdate(row.id, { _open: !row._open })}>
            {row._open ? '▲ Close' : '▼ Edit'}
          </button>
        </div>
      </div>

      {/* ── Expanded edit form ── */}
      {row._open && (
        <div className="ap-form">

          {/* Images */}
          <div className="ap-section">
            <div className="ap-section-title">📷 Product Images</div>
            <ImageManager images={row.images} sku={row.sku} productName={row.name}
              onChange={imgs => onUpdate(row.id, { images: imgs, _dirty: true })} />
          </div>

          {/* Core fields */}
          <div className="ap-section">
            <div className="ap-section-title">📝 Basic Info</div>
            <div className="ap-grid-2">
              <div className="ap-field-group ap-span-2">
                <label className="ap-label">Product Name *</label>
                <textarea className="ap-field ap-textarea" rows={2} value={row.name || ''}
                  placeholder="Full product name" onChange={e => f('name', e.target.value)} />
              </div>
              <div className="ap-field-group">
                <label className="ap-label">SKU / ID</label>
                <input className="ap-field" value={row.sku || ''} placeholder="e.g. NPT1"
                  onChange={e => f('sku', e.target.value)} />
              </div>
              <div className="ap-field-group">
                <label className="ap-label">Category *</label>
                <select className="ap-field ap-select" value={row.category || ''} onChange={e => f('category', e.target.value)}
                  style={{ borderColor: !row.category ? '#f59e0b' : '' }}>
                  <option value="">— select category —</option>
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="ap-field-group ap-span-2">
                <label className="ap-label">Description</label>
                <textarea className="ap-field ap-textarea" rows={3} value={row.description || ''}
                  placeholder="Product description for customers…" onChange={e => f('description', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="ap-section">
            <div className="ap-section-title">💰 Pricing & Stock</div>
            <div className="ap-grid-3">
              <div className="ap-field-group">
                <label className="ap-label">Price (₹)</label>
                <input className="ap-field" type="text" value={row.price || ''} placeholder="e.g. 480"
                  onChange={e => f('price', e.target.value)} />
              </div>
              <div className="ap-field-group">
                <label className="ap-label">Unit</label>
                <select className="ap-field ap-select" value={row.unit || 'KG'} onChange={e => f('unit', e.target.value)}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="ap-field-group">
                <label className="ap-label">Min. Order Qty</label>
                <input className="ap-field" value={row.min_qty || ''} placeholder="e.g. 4"
                  onChange={e => f('min_qty', e.target.value)} />
              </div>
              <div className="ap-field-group">
                <label className="ap-label">Inventory (units available)</label>
                <input className="ap-field" type="number" min="0" value={row.inventory ?? ''}
                  placeholder="Leave blank = unlimited"
                  onChange={e => f('inventory', e.target.value)} />
                {isOOS && <p className="ap-oos-hint">⚠ Set to 0 → product shows as Out of Stock</p>}
              </div>
              <div className="ap-field-group">
                <label className="ap-label">Availability</label>
                <select className="ap-field ap-select" value={row.availability || 'in stock'} onChange={e => f('availability', e.target.value)}>
                  <option value="in stock">In Stock</option>
                  <option value="out of stock">Out of Stock</option>
                </select>
              </div>
              <div className="ap-field-group">
                <label className="ap-label">Condition</label>
                <select className="ap-field ap-select" value={row.condition || 'new'} onChange={e => f('condition', e.target.value)}>
                  <option value="new">New</option>
                  <option value="used">Used / Refurbished</option>
                </select>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="ap-section">
            <div className="ap-section-title">🔧 Product Details</div>
            <div className="ap-grid-2">
              <div className="ap-field-group">
                <label className="ap-label">Brand</label>
                <input className="ap-field" value={row.brand || 'Arambhika Enablers'}
                  onChange={e => f('brand', e.target.value)} />
              </div>
              <div className="ap-field-group">
                <label className="ap-label">Material</label>
                <input className="ap-field" value={row.material || ''} placeholder="e.g. Nickel-plated steel"
                  onChange={e => f('material', e.target.value)} />
              </div>
              <div className="ap-field-group">
                <label className="ap-label">Dimensions / Size</label>
                <input className="ap-field" value={row.dimensions || ''} placeholder="e.g. 6 × 0.15 mm"
                  onChange={e => f('dimensions', e.target.value)} />
              </div>
              <div className="ap-field-group">
                <label className="ap-label">Featured on Home Page</label>
                <label className="ap-toggle">
                  <input type="checkbox" checked={!!row.featured}
                    onChange={e => f('featured', e.target.checked ? 1 : 0)} />
                  <span className="ap-toggle-label">{row.featured ? '⭐ Yes — shown on home' : 'No'}</span>
                </label>
              </div>
              <div className="ap-field-group ap-span-2">
                <label className="ap-label">Specifications</label>
                <SpecsEditor specs={row.specs}
                  onChange={specs => onUpdate(row.id, { specs, _dirty: true })} />
              </div>
            </div>
          </div>

          {/* Save row */}
          <div className="ap-form-footer">
            <button className="ap-save-main" disabled={!row._dirty || row._saving} onClick={() => onSave(row.id)}>
              {row._saving ? 'Saving…' : row._dirty ? '💾 Save Changes' : '✓ All Saved'}
            </button>
            <button className="ap-cancel-btn" onClick={() => onUpdate(row.id, { _open: false })}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Category Group ────────────────────────────────────────────────────────────
function CatGroup({ cat, catRows, isFirst, isLast, onMoveUp, onMoveDown,
                    onUpdateRow, onSaveRow, onDeleteRow,
                    onMoveProductUp, onMoveProductDown, siteUrl, allCategories }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="ap-cat-group">
      <div className="ap-cat-header">
        <div className="ap-cat-reorder">
          <button className="ap-move-btn" disabled={isFirst} onClick={onMoveUp}>▲</button>
          <button className="ap-move-btn" disabled={isLast}  onClick={onMoveDown}>▼</button>
        </div>
        <button className="ap-cat-toggle" onClick={() => setCollapsed(v => !v)}>
          {collapsed ? '▶' : '▼'}
        </button>
        <span className="ap-cat-name">{cat}</span>
        <span className="ap-cat-count">{catRows.length} product{catRows.length !== 1 ? 's' : ''}</span>
      </div>
      {!collapsed && catRows.map((row, idx) => (
        <ProductCard key={row.id} row={row} siteUrl={siteUrl} allCategories={allCategories}
          onUpdate={onUpdateRow} onSave={onSaveRow} onDelete={onDeleteRow}
          onMoveUp={() => onMoveProductUp(idx)}
          onMoveDown={() => onMoveProductDown(idx)}
          isFirst={idx === 0} isLast={idx === catRows.length - 1} />
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminProducts({ initialProducts, initialCategoryOrder, siteUrl }) {
  const [rows, setRows]         = useState(() => initialProducts.map(initRow))
  const [catOrder, setCatOrder] = useState(initialCategoryOrder)
  const [search, setSearch]     = useState('')

  const saveCatOrder = useCallback(async (order) => {
    await fetch('/api/admin/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    })
  }, [])

  const updateRow = useCallback((id, patch) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  }, [])

  const saveRow = async (id) => {
    const row = rows.find(r => r.id === id)
    if (!row) return
    if (!row.name?.trim() || !row.category) { alert('Name and Category are required.'); return }
    updateRow(id, { _saving: true })
    const body = {
      name: row.name.trim(), sku: row.sku?.trim() || null, category: row.category,
      price: row.price || null, unit: row.unit || 'KG', min_qty: row.min_qty || null,
      description: row.description || null,
      specs: row.specs.filter(s => s.key?.trim()),
      images: row.images,
      sort_order: Number(row.sort_order) || 0,
      availability: row.availability || 'in stock',
      condition: row.condition || 'new',
      material: row.material || null,
      dimensions: row.dimensions || null,
      brand: row.brand || 'Arambhika Enablers',
      featured: row.featured ? 1 : 0,
      inventory: row.inventory !== '' && row.inventory != null ? Number(row.inventory) : null,
    }
    try {
      if (row._isNew) {
        const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const data = await res.json()
        if (!res.ok) { alert(data.error || 'Failed'); updateRow(id, { _saving: false }); return }
        setRows(prev => prev.map(r => r.id === id
          ? { ...r, id: data.id, slug: data.slug, _isNew: false, _dirty: false, _saving: false } : r))
      } else {
        const res = await fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const data = await res.json()
        if (!res.ok) { alert(data.error || 'Failed'); updateRow(id, { _saving: false }); return }
        updateRow(id, { _dirty: false, _saving: false })
      }
    } catch { alert('Network error'); updateRow(id, { _saving: false }) }
  }

  const deleteRow = async (id) => {
    const row = rows.find(r => r.id === id)
    if (!row) return
    if (row._isNew) { setRows(prev => prev.filter(r => r.id !== id)); return }
    if (!confirm(`Delete "${row.name}"?`)) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const addRow = () => {
    const tempId = newTempId()
    setRows(prev => [{
      ...initRow({
        id: tempId, name: '', sku: '', category: catOrder[0] || '', price: '',
        unit: 'KG', min_qty: '', description: '', specs: [], images: [],
        sort_order: 0, availability: 'in stock', condition: 'new',
        brand: 'Arambhika Enablers', material: '', dimensions: '', slug: '', inventory: '',
      }),
      _isNew: true, _dirty: true, _open: true,
    }, ...prev])
  }

  const moveCategoryUp = (cat) => {
    const idx = catOrder.indexOf(cat)
    if (idx <= 0) return
    const next = [...catOrder];[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    setCatOrder(next); saveCatOrder(next)
  }
  const moveCategoryDown = (cat) => {
    const idx = catOrder.indexOf(cat)
    if (idx === -1 || idx >= catOrder.length - 1) return
    const next = [...catOrder];[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    setCatOrder(next); saveCatOrder(next)
  }

  const moveProductUp = async (cat, idx) => {
    const catRows = rows.filter(r => r.category === cat && !r._isNew)
    if (idx <= 0) return
    const a = catRows[idx - 1], b = catRows[idx]
    setRows(prev => prev.map(r => r.id === a.id ? { ...r, sort_order: b.sort_order } : r.id === b.id ? { ...r, sort_order: a.sort_order } : r))
    await fetch('/api/admin/reorder', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: [{ id: a.id, sort_order: b.sort_order }, { id: b.id, sort_order: a.sort_order }] }) })
  }
  const moveProductDown = async (cat, idx) => {
    const catRows = rows.filter(r => r.category === cat && !r._isNew)
    if (idx >= catRows.length - 1) return
    await moveProductUp(cat, idx + 1)
  }

  const q = search.toLowerCase()
  const filteredRows = rows.filter(r =>
    !q || (r.name || '').toLowerCase().includes(q) ||
    (r.sku || '').toLowerCase().includes(q) ||
    (r.category || '').toLowerCase().includes(q)
  )

  const grouped = {}
  catOrder.forEach(cat => { grouped[cat] = [] })
  filteredRows.forEach(r => {
    const cat = r.category || 'Uncategorised'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(r)
  })
  catOrder.forEach(cat => {
    if (grouped[cat]) grouped[cat].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  })

  const newRows = filteredRows.filter(r => r._isNew)
  const dirtyCount = rows.filter(r => r._dirty).length
  const visibleCats = catOrder.filter(cat => (grouped[cat] || []).length > 0 || !q)

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <h1>Arambhika Admin</h1>
        <nav className="admin-nav">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/products" style={{ color: 'var(--accent)', fontWeight: 700 }}>Products</Link>
          <Link href="/admin/blogs">Blogs</Link>
          <Link href="/admin/categories">Categories</Link>
          <Link href="/admin/settings">Site Settings</Link>
          <Link href="/" target="_blank">View Site ↗</Link>
          <a href="/api/auth/logout" style={{ color: '#f87171' }}>Logout</a>
        </nav>
      </header>

      <div className="admin-content" style={{ padding: '1.25rem 1.5rem', maxWidth: '100%' }}>
        <div className="ap-topbar">
          <div>
            <h2 className="admin-page-title" style={{ marginBottom: 0 }}>
              Products
              <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--muted)', marginLeft: '0.5rem' }}>
                ({rows.filter(r => !r._isNew).length})
              </span>
              {dirtyCount > 0 && (
                <span style={{ fontSize: '0.82rem', color: '#f59e0b', marginLeft: '0.75rem' }}>
                  ● {dirtyCount} unsaved
                </span>
              )}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
              Click <strong>▼ Edit</strong> on any product to expand its edit form.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="pg-search" type="text" placeholder="Search products…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-primary" onClick={addRow}>+ Add Product</button>
            <button className="btn-secondary" onClick={() => window.location.href = '/api/admin/export'}>⬇ Export Excel</button>
          </div>
        </div>

        {/* New unsaved rows */}
        {newRows.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div className="ap-section-label">New (unsaved)</div>
            {newRows.map(row => (
              <ProductCard key={row.id} row={row} siteUrl={siteUrl} allCategories={catOrder}
                onUpdate={updateRow} onSave={saveRow} onDelete={deleteRow}
                onMoveUp={() => {}} onMoveDown={() => {}} isFirst isLast />
            ))}
          </div>
        )}

        {/* Category groups */}
        {visibleCats.map((cat, catIdx) => {
          const catRows = (grouped[cat] || []).filter(r => !r._isNew)
          if (catRows.length === 0 && q) return null
          return (
            <CatGroup key={cat} cat={cat} catRows={catRows}
              isFirst={catIdx === 0} isLast={catIdx === visibleCats.length - 1}
              onMoveUp={() => moveCategoryUp(cat)}
              onMoveDown={() => moveCategoryDown(cat)}
              onUpdateRow={updateRow} onSaveRow={saveRow} onDeleteRow={deleteRow}
              onMoveProductUp={(idx) => moveProductUp(cat, idx)}
              onMoveProductDown={(idx) => moveProductDown(cat, idx)}
              siteUrl={siteUrl} allCategories={catOrder} />
          )
        })}
      </div>
    </div>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session?.admin) return { redirect: { destination: '/admin', permanent: false } }
  try {
    const { getAllProductsSorted, getCategoriesOrdered, getCategoryNames } = require('../../../lib/db')
    const products = getAllProductsSorted()
    const catData  = getCategoriesOrdered()
    const catNames = getCategoryNames()
    const dbOrder  = catData.map(c => c.category)
    const allCats  = [...new Set([...dbOrder, ...products.map(p => p.category).filter(Boolean), ...catNames])]
    const siteUrl  = process.env.SITE_URL || 'http://168.144.189.151'
    return { props: { initialProducts: products.map(p => ({ ...p })), initialCategoryOrder: allCats, siteUrl } }
  } catch (e) {
    return { props: { initialProducts: [], initialCategoryOrder: [], siteUrl: '' } }
  }
}
