import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { getSession } from '../../../lib/session'

const CATEGORIES = [
  'Nickel Strip Plated',
  'Nickel Strip Pure',
  'Nickel Strip Plated with Holder',
  'Nickel Strip Pure with Holder',
  'Copper Busbar',
  'Aluminium Busbar',
  'Cell Prismatic',
  'Cell Li-ion',
  'Cell LFP',
  'Other',
]

const UNITS = ['KG', 'Piece', 'Meter', 'Roll', 'Box', 'Set']

const AVAIL = ['in stock', 'out of stock']

let _tempId = -1
function newTempId() { return _tempId-- }

function initRow(p) {
  return {
    ...p,
    specs: typeof p.specs === 'string' ? JSON.parse(p.specs || '[]') : (p.specs || []),
    images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || []),
    sort_order: p.sort_order ?? 0,
    availability: p.availability || 'in stock',
    condition: p.condition || 'new',
    material: p.material || '',
    dimensions: p.dimensions || '',
    _dirty: false, _saving: false, _expanded: false, _imgOpen: false, _isNew: false,
  }
}

// ── Image Manager ─────────────────────────────────────────────────────────────
function ImageManager({ images, onChange }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    const newUrls = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
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
          <button className="pg-img-remove" onClick={() => onChange(images.filter((_, n) => n !== i))}>✕</button>
        </div>
      ))}
      <input type="file" ref={fileRef} accept="image/*" multiple style={{ display: 'none' }} onChange={upload} />
      <button className="pg-upload-btn" onClick={() => fileRef.current.click()} disabled={uploading}>
        {uploading ? '⏳' : '+ Add image'}
      </button>
    </div>
  )
}

// ── Specs Mini Editor ─────────────────────────────────────────────────────────
function SpecsEditor({ specs, onChange }) {
  const update = (i, field, val) =>
    onChange(specs.map((s, n) => n === i ? { ...s, [field]: val } : s))
  return (
    <div className="pg-specs-mini">
      {specs.map((s, i) => (
        <div key={i} className="pg-spec-row">
          <input className="pg-input" value={s.key} onChange={e => update(i, 'key', e.target.value)} placeholder="Property" />
          <input className="pg-input" value={s.value} onChange={e => update(i, 'value', e.target.value)} placeholder="Value" />
          <button className="pg-img-remove" style={{ position: 'static' }} onClick={() => onChange(specs.filter((_, n) => n !== i))}>✕</button>
        </div>
      ))}
      <button className="pg-manage-btn" onClick={() => onChange([...specs, { key: '', value: '' }])}>+ Add spec</button>
    </div>
  )
}

// ── Single Product Row ────────────────────────────────────────────────────────
function ProductRow({ row, onUpdate, onSave, onDelete }) {
  const f = (field, val) => onUpdate(row.id, { [field]: val, _dirty: true })

  const firstImg = row.images[0]

  return (
    <>
      <tr className={row._isNew ? 'pg-tr-new' : ''}>
        {/* Sort order */}
        <td style={{ width: 48 }}>
          <input className="pg-sort-input" type="number" value={row.sort_order}
            onChange={e => f('sort_order', Number(e.target.value))} />
        </td>

        {/* Image */}
        <td style={{ width: 72 }}>
          <div className="pg-img-cell">
            {firstImg
              ? <img className="pg-thumb" src={firstImg} alt="" />
              : <div className="pg-no-img">no img</div>}
            <button className="pg-manage-btn" onClick={() => onUpdate(row.id, { _imgOpen: !row._imgOpen })}>
              {row.images.length > 0 ? `${row.images.length} 🖼` : '+ img'}
            </button>
          </div>
        </td>

        {/* SKU */}
        <td style={{ width: 80 }}>
          <input className="pg-input" value={row.sku || ''} placeholder="SKU"
            onChange={e => f('sku', e.target.value)} />
        </td>

        {/* Name */}
        <td style={{ minWidth: 200 }}>
          <input className="pg-input" value={row.name || ''} placeholder="Product name *"
            onChange={e => f('name', e.target.value)} />
        </td>

        {/* Category */}
        <td style={{ width: 160 }}>
          <select className="pg-select" value={row.category || ''} onChange={e => f('category', e.target.value)}>
            <option value="">-- category --</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </td>

        {/* Price */}
        <td style={{ width: 80 }}>
          <input className="pg-input" value={row.price || ''} placeholder="₹"
            onChange={e => f('price', e.target.value)} />
        </td>

        {/* Unit */}
        <td style={{ width: 70 }}>
          <select className="pg-select" value={row.unit || 'KG'} onChange={e => f('unit', e.target.value)}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </td>

        {/* Min qty */}
        <td style={{ width: 70 }}>
          <input className="pg-input" value={row.min_qty || ''} placeholder="min"
            onChange={e => f('min_qty', e.target.value)} />
        </td>

        {/* Availability */}
        <td style={{ width: 110 }}>
          <select className="pg-select" value={row.availability || 'in stock'} onChange={e => f('availability', e.target.value)}>
            {AVAIL.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </td>

        {/* Actions */}
        <td style={{ width: 130, whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
            <button className="pg-expand-btn" title="Expand details"
              onClick={() => onUpdate(row.id, { _expanded: !row._expanded })}>
              {row._expanded ? '▲' : '▼'}
            </button>
            <button
              className="pg-save-btn"
              disabled={!row._dirty || row._saving}
              onClick={() => onSave(row.id)}
              style={{ opacity: row._dirty ? 1 : 0.3 }}
            >
              {row._saving ? '…' : '✓ Save'}
            </button>
            {!row._isNew && (
              <a href={`/store/${row.slug}`} target="_blank" rel="noopener noreferrer" className="pg-view-btn" title="View on site">↗</a>
            )}
            <button className="pg-del-btn" onClick={() => onDelete(row.id)} title="Delete">✕</button>
          </div>
        </td>
      </tr>

      {/* Image manager row */}
      {row._imgOpen && (
        <tr>
          <td colSpan={10} className="pg-expanded-cell" style={{ background: '#fffbeb', borderBottom: '2px solid #fcd34d' }}>
            <p className="pg-field-label" style={{ marginBottom: '0.5rem' }}>
              Images — {row.images.length} uploaded &nbsp;
              <span style={{ fontWeight: 400, color: '#6b7280', textTransform: 'none' }}>First image is the main display image</span>
            </p>
            <ImageManager images={row.images}
              onChange={imgs => onUpdate(row.id, { images: imgs, _dirty: true })} />
          </td>
        </tr>
      )}

      {/* Expanded details row */}
      {row._expanded && (
        <tr>
          <td colSpan={10} className="pg-expanded-cell">
            <div className="pg-exp-grid">
              <div>
                <p className="pg-field-label">Description</p>
                <textarea className="pg-textarea" rows={3} value={row.description || ''}
                  placeholder="Short product description…"
                  onChange={e => f('description', e.target.value)} />
              </div>
              <div>
                <p className="pg-field-label">Dimensions / Size</p>
                <input className="pg-input pg-input-full" value={row.dimensions || ''}
                  placeholder="e.g. 6 x 0.15 mm"
                  onChange={e => f('dimensions', e.target.value)} />
                <p className="pg-field-label" style={{ marginTop: '0.75rem' }}>Material</p>
                <input className="pg-input pg-input-full" value={row.material || ''}
                  placeholder="e.g. Nickel-plated steel"
                  onChange={e => f('material', e.target.value)} />
                <p className="pg-field-label" style={{ marginTop: '0.75rem' }}>Condition</p>
                <select className="pg-select" value={row.condition || 'new'} onChange={e => f('condition', e.target.value)}>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p className="pg-field-label">Specifications (key → value pairs)</p>
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
export default function AdminProducts({ initialProducts }) {
  const [rows, setRows] = useState(() => initialProducts.map(initRow))
  const [search, setSearch] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')
  const [filterCat, setFilterCat] = useState('')

  const updateRow = useCallback((id, patch) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  }, [])

  const addRow = () => {
    const tempId = newTempId()
    setRows(prev => [initRow({
      id: tempId, name: '', sku: '', category: '', price: '', unit: 'KG',
      min_qty: '', description: '', specs: [], images: [],
      sort_order: 0, availability: 'in stock', condition: 'new',
      material: '', dimensions: '', slug: '',
      _isNew: true, _dirty: true, _expanded: true,
    }), ...prev])
  }

  const saveRow = async (id) => {
    const row = rows.find(r => r.id === id)
    if (!row) return
    if (!row.name?.trim() || !row.category) {
      alert('Name and Category are required.')
      return
    }
    updateRow(id, { _saving: true })

    const body = {
      name: row.name.trim(),
      sku: row.sku?.trim() || null,
      category: row.category,
      price: row.price || null,
      unit: row.unit || 'KG',
      min_qty: row.min_qty || null,
      description: row.description || null,
      specs: row.specs.filter(s => s.key?.trim()),
      images: row.images,
      sort_order: Number(row.sort_order) || 0,
      availability: row.availability || 'in stock',
      condition: row.condition || 'new',
      material: row.material || null,
      dimensions: row.dimensions || null,
    }

    try {
      if (row._isNew) {
        const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const data = await res.json()
        if (!res.ok) { alert(data.error || 'Failed to create'); updateRow(id, { _saving: false }); return }
        // Replace temp row with real row
        setRows(prev => prev.map(r => r.id === id ? { ...r, id: data.id, slug: data.slug, _isNew: false, _dirty: false, _saving: false } : r))
      } else {
        const res = await fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const data = await res.json()
        if (!res.ok) { alert(data.error || 'Failed to save'); updateRow(id, { _saving: false }); return }
        updateRow(id, { _dirty: false, _saving: false })
      }
    } catch (e) {
      alert('Network error')
      updateRow(id, { _saving: false })
    }
  }

  const deleteRow = async (id) => {
    const row = rows.find(r => r.id === id)
    if (!row) return
    if (row._isNew) { setRows(prev => prev.filter(r => r.id !== id)); return }
    if (!confirm(`Delete "${row.name}"? This cannot be undone.`)) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const runSeed = async () => {
    if (!confirm('This will import all 55 products from the Excel template. Existing products with the same slug will be skipped. Continue?')) return
    setSeeding(true)
    setSeedMsg('')
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSeedMsg(`✓ Imported ${data.inserted} new products (${data.total - data.inserted} already existed). Refresh to see them.`)
      } else {
        setSeedMsg('✗ ' + (data.error || 'Import failed'))
      }
    } catch (e) {
      setSeedMsg('✗ Network error')
    }
    setSeeding(false)
  }

  const filtered = rows.filter(r => {
    if (filterCat && r.category !== filterCat && !r._isNew) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (r.name || '').toLowerCase().includes(q)
      || (r.sku || '').toLowerCase().includes(q)
      || (r.category || '').toLowerCase().includes(q)
  })

  const dirtyCount = rows.filter(r => r._dirty).length

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

      <div className="admin-content" style={{ padding: '1.5rem', maxWidth: '100%' }}>
        {/* Top bar */}
        <div className="pg-topbar">
          <div>
            <h2 className="admin-page-title" style={{ marginBottom: 0 }}>
              Products &nbsp;<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--muted)' }}>({rows.filter(r => !r._isNew).length})</span>
              {dirtyCount > 0 && <span style={{ fontSize: '0.82rem', color: '#f59e0b', marginLeft: '0.75rem' }}>● {dirtyCount} unsaved</span>}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="pg-search" type="text" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="pg-select" style={{ width: 160 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary" onClick={addRow}>+ Add Product</button>
            <button className="btn-secondary" onClick={runSeed} disabled={seeding}
              title="Import 55 products from the Excel template">
              {seeding ? 'Importing…' : '⬆ Seed from Excel'}
            </button>
          </div>
        </div>

        {seedMsg && (
          <div className={`alert ${seedMsg.startsWith('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1rem' }}>
            {seedMsg}
            {seedMsg.startsWith('✓') && (
              <button onClick={() => window.location.reload()} style={{ marginLeft: '1rem', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                Refresh now →
              </button>
            )}
          </div>
        )}

        {/* Spreadsheet */}
        <div className="pg-sheet">
          <table className="pg-table">
            <thead>
              <tr>
                <th title="Display order within category">#</th>
                <th>Image</th>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price ₹</th>
                <th>Unit</th>
                <th>Min Qty</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                    {search || filterCat ? 'No products match your filter.' : 'No products yet. Click "+ Add Product" or "Seed from Excel".'}
                  </td>
                </tr>
              ) : filtered.map(row => (
                <ProductRow
                  key={row.id}
                  row={row}
                  onUpdate={updateRow}
                  onSave={saveRow}
                  onDelete={deleteRow}
                />
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
          Click ▼ on any row to edit description, dimensions, material, and specs. Click the image button to manage photos. Changes highlight the Save button — click it to persist.
        </p>
      </div>
    </div>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session?.admin) return { redirect: { destination: '/admin', permanent: false } }
  try {
    const { getAllProducts } = require('../../../lib/db')
    const products = getAllProducts()
    return { props: { initialProducts: products.map(p => ({ ...p })) } }
  } catch {
    return { props: { initialProducts: [] } }
  }
}
