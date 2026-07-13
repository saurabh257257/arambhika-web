import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { getSession } from '../../../lib/session'

const CATEGORIES = [
  'Nickel Strip Plated','Nickel Strip Pure',
  'Nickel Strip Plated with Holder','Nickel Strip Pure with Holder',
  'Copper Busbar','Aluminium Busbar',
  'Cell Prismatic','Cell Li-ion','Cell LFP','Other',
]
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
    specs:        typeof p.specs   === 'string' ? JSON.parse(p.specs   || '[]') : (p.specs   || []),
    images:       typeof p.images  === 'string' ? JSON.parse(p.images  || '[]') : (p.images  || []),
    sort_order:   p.sort_order   ?? 0,
    availability: p.availability || 'in stock',
    condition:    p.condition    || 'new',
    brand:        p.brand        || 'Arambhika Enablers',
    material:     p.material     || '',
    dimensions:   p.dimensions   || '',
    _dirty: false, _saving: false, _expanded: false, _imgOpen: false, _isNew: false,
  }
}

// ── Image Manager (with auto-naming) ─────────────────────────────────────────
function ImageManager({ images, onChange, sku, productName }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    const newUrls = []
    const prefix = slugifyPrefix(sku, productName || 'product')
    let idx = images.length + 1

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
    <div className="pg-img-manager">
      {images.map((url, i) => (
        <div key={i} className="pg-img-item">
          <img src={url} alt={`img ${i + 1}`} />
          <div className="pg-img-label">{i + 1}</div>
          <button className="pg-img-remove" onClick={() => onChange(images.filter((_, n) => n !== i))}>✕</button>
        </div>
      ))}
      <input type="file" ref={fileRef} accept="image/*" multiple style={{ display: 'none' }} onChange={upload} />
      <button className="pg-upload-btn" onClick={() => fileRef.current.click()} disabled={uploading}>
        {uploading ? '⏳ Uploading…' : '+ Add image'}
      </button>
      {images.length > 0 && (
        <div className="pg-img-hint">
          Image links: {images.map((u, i) => (
            <span key={i} style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', wordBreak: 'break-all' }}>{u}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Specs Editor ──────────────────────────────────────────────────────────────
function SpecsEditor({ specs, onChange }) {
  const upd = (i, field, val) =>
    onChange(specs.map((s, n) => n === i ? { ...s, [field]: val } : s))
  return (
    <div className="pg-specs-mini">
      {specs.map((s, i) => (
        <div key={i} className="pg-spec-row">
          <input className="pg-input" value={s.key}   onChange={e => upd(i, 'key',   e.target.value)} placeholder="Property" />
          <input className="pg-input" value={s.value} onChange={e => upd(i, 'value', e.target.value)} placeholder="Value" />
          <button className="pg-img-remove" style={{ position: 'static' }}
            onClick={() => onChange(specs.filter((_, n) => n !== i))}>✕</button>
        </div>
      ))}
      <button className="pg-manage-btn" onClick={() => onChange([...specs, { key: '', value: '' }])}>+ Add spec</button>
    </div>
  )
}

// ── Product Row ───────────────────────────────────────────────────────────────
function ProductRow({ row, onUpdate, onSave, onDelete, onMoveUp, onMoveDown, isFirst, isLast, siteUrl, allCategories }) {
  const f = (field, val) => onUpdate(row.id, { [field]: val, _dirty: true })
  const firstImg = row.images[0]

  return (
    <>
      <tr className={row._isNew ? 'pg-tr-new' : ''}>

        {/* Move within category */}
        <td style={{ width: 36 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <button className="pg-move-btn" disabled={isFirst}  onClick={onMoveUp}>▲</button>
            <button className="pg-move-btn" disabled={isLast}   onClick={onMoveDown}>▼</button>
          </div>
        </td>

        {/* image_link */}
        <td style={{ width: 80 }}>
          <div className="pg-img-cell">
            {firstImg
              ? <img className="pg-thumb" src={firstImg} alt="" />
              : <div className="pg-no-img">no img</div>}
            <button className="pg-manage-btn" onClick={() => onUpdate(row.id, { _imgOpen: !row._imgOpen })}>
              {row.images.length > 0 ? `${row.images.length}🖼` : '+img'}
            </button>
          </div>
        </td>

        {/* id (SKU) */}
        <td style={{ width: 80 }}>
          <input className="pg-input" value={row.sku || ''} placeholder="SKU"
            onChange={e => f('sku', e.target.value)} />
        </td>

        {/* title */}
        <td style={{ minWidth: 160 }}>
          <input className="pg-input" value={row.name || ''} placeholder="Product name *"
            onChange={e => f('name', e.target.value)} />
        </td>

        {/* category — always visible so new products can be assigned */}
        <td style={{ width: 150 }}>
          <select className="pg-select" value={row.category || ''} onChange={e => f('category', e.target.value)}
            style={{ fontSize: '0.78rem', borderColor: !row.category ? '#f59e0b' : 'transparent' }}>
            <option value="">— pick category —</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </td>

        {/* description (truncated) */}
        <td style={{ minWidth: 140 }}>
          <input className="pg-input" value={row.description || ''} placeholder="Description…"
            onChange={e => f('description', e.target.value)}
            title={row.description || ''}
            style={{ fontSize: '0.78rem' }} />
        </td>

        {/* availability */}
        <td style={{ width: 100 }}>
          <select className="pg-select" value={row.availability || 'in stock'} onChange={e => f('availability', e.target.value)}>
            <option value="in stock">in stock</option>
            <option value="out of stock">out of stock</option>
          </select>
        </td>

        {/* condition */}
        <td style={{ width: 70 }}>
          <select className="pg-select" value={row.condition || 'new'} onChange={e => f('condition', e.target.value)}>
            <option value="new">new</option>
            <option value="used">used</option>
          </select>
        </td>

        {/* price */}
        <td style={{ width: 100 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            <input className="pg-input" value={row.price || ''} placeholder="₹"
              onChange={e => f('price', e.target.value)} style={{ width: 60 }} />
            <select className="pg-select" value={row.unit || 'KG'} onChange={e => f('unit', e.target.value)} style={{ width: 50 }}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </td>

        {/* brand */}
        <td style={{ width: 140 }}>
          <input className="pg-input" value={row.brand || 'Arambhika Enablers'}
            onChange={e => f('brand', e.target.value)} />
        </td>

        {/* link (auto) */}
        <td style={{ width: 36, textAlign: 'center' }}>
          {!row._isNew && row.slug && (
            <a href={`${siteUrl}/store/${row.slug}`} target="_blank" rel="noopener noreferrer"
              className="pg-view-btn" title={`${siteUrl}/store/${row.slug}`}>↗</a>
          )}
        </td>

        {/* Actions */}
        <td style={{ width: 90, whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
            <button className="pg-expand-btn" onClick={() => onUpdate(row.id, { _expanded: !row._expanded })}>
              {row._expanded ? '▲' : '▼'}
            </button>
            <button className="pg-save-btn" disabled={!row._dirty || row._saving}
              onClick={() => onSave(row.id)} style={{ opacity: row._dirty ? 1 : 0.3 }}>
              {row._saving ? '…' : '✓'}
            </button>
            <button className="pg-del-btn" onClick={() => onDelete(row.id)}>✕</button>
          </div>
        </td>
      </tr>

      {/* Image manager */}
      {row._imgOpen && (
        <tr>
          <td colSpan={12} className="pg-expanded-cell" style={{ background: '#fffbeb', borderBottom: '2px solid #fcd34d' }}>
            <p className="pg-field-label" style={{ marginBottom: '0.5rem' }}>
              Images &nbsp;
              <span style={{ fontWeight: 400, color: '#6b7280', textTransform: 'none' }}>
                Auto-named: {slugifyPrefix(row.sku, row.name || 'product')}_1.jpg, _2.jpg …
              </span>
            </p>
            <ImageManager images={row.images} sku={row.sku} productName={row.name}
              onChange={imgs => onUpdate(row.id, { images: imgs, _dirty: true })} />
          </td>
        </tr>
      )}

      {/* Expanded details */}
      {row._expanded && (
        <tr>
          <td colSpan={12} className="pg-expanded-cell">
            <div className="pg-exp-grid">
              <div>
                <p className="pg-field-label">Min Qty</p>
                <input className="pg-input pg-input-full" value={row.min_qty || ''}
                  placeholder="e.g. 4"
                  onChange={e => onUpdate(row.id, { min_qty: e.target.value, _dirty: true })} />
                <p className="pg-field-label" style={{ marginTop: '0.75rem' }}>Dimensions / Size</p>
                <input className="pg-input pg-input-full" value={row.dimensions || ''}
                  placeholder="e.g. 6 x 0.15 mm"
                  onChange={e => onUpdate(row.id, { dimensions: e.target.value, _dirty: true })} />
                <p className="pg-field-label" style={{ marginTop: '0.75rem' }}>Material</p>
                <input className="pg-input pg-input-full" value={row.material || ''}
                  placeholder="e.g. Nickel-plated steel"
                  onChange={e => onUpdate(row.id, { material: e.target.value, _dirty: true })} />
              </div>
              <div style={{ gridColumn: '2 / -1' }}>
                <p className="pg-field-label">Specifications (key → value)</p>
                <SpecsEditor specs={row.specs}
                  onChange={specs => onUpdate(row.id, { specs, _dirty: true })} />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminProducts({ initialProducts, initialCategoryOrder, siteUrl }) {
  const [rows, setRows]           = useState(() => initialProducts.map(initRow))
  const [catOrder, setCatOrder]   = useState(initialCategoryOrder)
  const [search, setSearch]       = useState('')
  const [seeding, setSeeding]     = useState(false)
  const [seedMsg, setSeedMsg]     = useState('')

  // Persist category order to DB on change
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
    setRows(prev => [initRow({
      id: tempId, name: '', sku: '', category: '', price: '',
      unit: 'KG', min_qty: '', description: '', specs: [], images: [],
      sort_order: 0, availability: 'in stock', condition: 'new',
      brand: 'Arambhika Enablers', material: '', dimensions: '', slug: '',
      _isNew: true, _dirty: true, _expanded: true,
    }), ...prev])
  }

  const downloadExcel = () => { window.location.href = '/api/admin/export' }

  // ── Category ordering ────────────────────────────────────────────────────────
  const moveCategoryUp = (cat) => {
    const idx = catOrder.indexOf(cat)
    if (idx <= 0) return
    const newOrder = [...catOrder]
    ;[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]]
    setCatOrder(newOrder)
    saveCatOrder(newOrder)
  }

  const moveCategoryDown = (cat) => {
    const idx = catOrder.indexOf(cat)
    if (idx === -1 || idx >= catOrder.length - 1) return
    const newOrder = [...catOrder]
    ;[newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]]
    setCatOrder(newOrder)
    saveCatOrder(newOrder)
  }

  // ── Product ordering within category ────────────────────────────────────────
  const moveProductUp = async (cat, idx) => {
    const catRows = rows.filter(r => r.category === cat && !r._isNew)
    if (idx <= 0) return
    const a = catRows[idx - 1]
    const b = catRows[idx]
    const newSortA = b.sort_order
    const newSortB = a.sort_order
    setRows(prev => prev.map(r =>
      r.id === a.id ? { ...r, sort_order: newSortA } :
      r.id === b.id ? { ...r, sort_order: newSortB } : r
    ))
    await fetch('/api/admin/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: [{ id: a.id, sort_order: newSortA }, { id: b.id, sort_order: newSortB }] }),
    })
  }

  const moveProductDown = async (cat, idx) => {
    const catRows = rows.filter(r => r.category === cat && !r._isNew)
    if (idx >= catRows.length - 1) return
    await moveProductUp(cat, idx + 1)
  }

  const runSeed = async () => {
    if (!confirm('This will wipe all products and re-import 55 from the Excel template. Continue?')) return
    setSeeding(true); setSeedMsg('')
    const res = await fetch('/api/admin/seed', { method: 'POST' })
    const data = await res.json()
    setSeedMsg(res.ok ? `✓ Imported ${data.inserted} products. Refresh to see them.` : '✗ ' + data.error)
    setSeeding(false)
  }

  // ── Build grouped view ───────────────────────────────────────────────────────
  const q = search.toLowerCase()
  const filteredRows = rows.filter(r =>
    !q || (r.name || '').toLowerCase().includes(q) ||
    (r.sku || '').toLowerCase().includes(q) ||
    (r.category || '').toLowerCase().includes(q)
  )

  // Group by category in catOrder
  const grouped = {}
  catOrder.forEach(cat => { grouped[cat] = [] })
  filteredRows.forEach(r => {
    const cat = r.category || 'Other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(r)
  })

  // Sort products within each category by sort_order
  catOrder.forEach(cat => {
    if (grouped[cat]) {
      grouped[cat].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    }
  })

  // New rows (no category yet) go at top
  const newRows = filteredRows.filter(r => r._isNew)
  const dirtyCount = rows.filter(r => r._dirty).length

  const visibleCats = catOrder.filter(cat => (grouped[cat] || []).length > 0 || !q)

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <h1>Arambhika Admin</h1>
        <nav className="admin-nav">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/products">Products</Link>
          <Link href="/admin/blogs">Blogs</Link>
          <Link href="/" target="_blank">View Site ↗</Link>
          <a href="/api/auth/logout" style={{ color: '#f87171' }}>Logout</a>
        </nav>
      </header>

      <div className="admin-content" style={{ padding: '1.25rem', maxWidth: '100%' }}>
        {/* Top bar */}
        <div className="pg-topbar">
          <h2 className="admin-page-title" style={{ marginBottom: 0 }}>
            Products &nbsp;<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--muted)' }}>
              ({rows.filter(r => !r._isNew).length})
            </span>
            {dirtyCount > 0 && <span style={{ fontSize: '0.82rem', color: '#f59e0b', marginLeft: '0.75rem' }}>● {dirtyCount} unsaved</span>}
          </h2>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="pg-search" type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-primary" onClick={addRow}>+ Add Product</button>
            <button className="btn-secondary" onClick={downloadExcel}>⬇ Download Excel</button>
            <button className="btn-secondary" onClick={runSeed} disabled={seeding}>
              {seeding ? 'Importing…' : '⬆ Seed from Excel'}
            </button>
          </div>
        </div>

        {seedMsg && (
          <div className={`alert ${seedMsg.startsWith('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1rem' }}>
            {seedMsg}
            {seedMsg.startsWith('✓') && (
              <button onClick={() => window.location.reload()} style={{ marginLeft: '1rem', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                Refresh →
              </button>
            )}
          </div>
        )}

        {/* Column headers legend */}
        <div className="pg-wa-legend">
          <span>WA catalog fields →</span>
          <span>image_link</span><span>id</span><span>title</span>
          <span>description</span><span>availability</span><span>condition</span>
          <span>price</span><span>brand</span><span>link</span>
        </div>

        <div className="pg-sheet">
          <table className="pg-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>↕</th>
                <th>Image</th>
                <th>SKU</th>
                <th>Name / Title</th>
                <th>Description</th>
                <th>Availability</th>
                <th>Condition</th>
                <th>Price / Unit</th>
                <th>Brand</th>
                <th style={{ width: 36 }}>Link</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* New unsaved rows first */}
              {newRows.map((row) => (
                <ProductRow key={row.id} row={row} siteUrl={siteUrl} allCategories={catOrder}
                  onUpdate={updateRow} onSave={saveRow} onDelete={deleteRow}
                  onMoveUp={() => {}} onMoveDown={() => {}}
                  isFirst={true} isLast={true} />
              ))}

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
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--muted)' }}>
          ▲▼ on the left moves products within a category. Category ▲▼ reorder the groups. ▼ expands dimensions, material &amp; specs. Click the image button to manage photos.
        </p>
      </div>
    </div>
  )
}

// ── Category group rows ───────────────────────────────────────────────────────
function CatGroup({ cat, catRows, isFirst, isLast, onMoveUp, onMoveDown,
                    onUpdateRow, onSaveRow, onDeleteRow,
                    onMoveProductUp, onMoveProductDown, siteUrl, allCategories }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <>
      <tr className="pg-cat-header">
        <td colSpan={12}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <button className="pg-move-btn pg-cat-move" disabled={isFirst}  onClick={onMoveUp}>▲</button>
              <button className="pg-move-btn pg-cat-move" disabled={isLast}   onClick={onMoveDown}>▼</button>
            </div>
            <button className="pg-cat-toggle" onClick={() => setCollapsed(v => !v)}>
              {collapsed ? '▶' : '▼'}
            </button>
            <span className="pg-cat-name">{cat}</span>
            <span className="pg-cat-count">{catRows.length} product{catRows.length !== 1 ? 's' : ''}</span>
          </div>
        </td>
      </tr>
      {!collapsed && catRows.map((row, idx) => (
        <ProductRow key={row.id} row={row} siteUrl={siteUrl} allCategories={allCategories}
          onUpdate={onUpdateRow} onSave={onSaveRow} onDelete={onDeleteRow}
          onMoveUp={() => onMoveProductUp(idx)}
          onMoveDown={() => onMoveProductDown(idx)}
          isFirst={idx === 0} isLast={idx === catRows.length - 1} />
      ))}
    </>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session?.admin) return { redirect: { destination: '/admin', permanent: false } }
  try {
    const { getAllProductsSorted, getCategoriesOrdered } = require('../../../lib/db')
    const products = getAllProductsSorted()
    const catData  = getCategoriesOrdered()

    // Build category order from DB, then fill in any missing categories
    const dbOrder = catData.map(c => c.category)
    const allCats = [...new Set([...dbOrder, ...products.map(p => p.category).filter(Boolean)])]

    const siteUrl = process.env.SITE_URL || 'http://168.144.189.151'
    return { props: {
      initialProducts:      products.map(p => ({ ...p })),
      initialCategoryOrder: allCats,
      siteUrl,
    }}
  } catch (e) {
    return { props: { initialProducts: [], initialCategoryOrder: [...CATEGORIES], siteUrl: '' } }
  }
}
