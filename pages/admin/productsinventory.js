import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { getSession } from '../../lib/session'

function availStatus(row) {
  const inv = row.inventory === '' || row.inventory == null ? null : Number(row.inventory)
  if (inv === 0) return 'request'
  if (inv == null) return 'unknown'
  return 'in'
}

// ── VIEW MODE ─────────────────────────────────────────────────────────────────
function ViewMode({ rows }) {
  const [filter, setFilter] = useState('all') // 'all' | 'in' | 'request'

  // Sort: available first, then on-request, then unknown
  const sortRank = (r) => ({ in: 0, unknown: 1, request: 2 }[availStatus(r)] ?? 1)

  // Group by category, sorted within each
  const grouped = useMemo(() => {
    const g = {}
    rows.forEach(r => {
      const cat = r.category || 'Other'
      if (!g[cat]) g[cat] = []
      g[cat].push(r)
    })
    Object.keys(g).forEach(cat => {
      g[cat].sort((a, b) => sortRank(a) - sortRank(b))
    })
    return g
  }, [rows])

  const counts = useMemo(() => ({
    all: rows.length,
    in:  rows.filter(r => availStatus(r) === 'in').length,
    request: rows.filter(r => availStatus(r) === 'request').length,
    unknown: rows.filter(r => availStatus(r) === 'unknown').length,
  }), [rows])

  const filterRow = (r) => filter === 'all' || availStatus(r) === filter

  return (
    <div>
      {/* Filter pills */}
      <div className="inv-filter-bar">
        <span className="inv-filter-label">Show:</span>
        {[
          { key: 'all',     label: `All (${counts.all})` },
          { key: 'in',      label: `🟢 Available (${counts.in})` },
          { key: 'request', label: `🟡 On Request (${counts.request})` },
        ].map(f => (
          <button key={f.key}
            className={`inv-filter-pill${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Compact category grid */}
      {Object.entries(grouped).map(([cat, catRows]) => {
        const visible = catRows.filter(filterRow)
        if (!visible.length) return null
        return (
          <div key={cat} className="inv-view-cat">
            <div className="inv-view-cat-hdr">
              {cat}
              <span>{visible.length} of {catRows.length}</span>
            </div>
            <div className="inv-view-grid">
              {visible.map(r => {
                const st = availStatus(r)
                return (
                  <div key={r.id} className={`inv-view-item inv-view-${st}`}>
                    <div className="inv-view-name">{r.name}</div>
                    {r.sku && <div className="inv-view-sku">#{r.sku}</div>}
                    <div className={`inv-view-badge inv-badge-${st}`}>
                      {st === 'in'
                        ? `● ${r.inventory}${r.unit ? ' ' + r.unit : ''}`
                        : st === 'request' ? '● On Request' : '— not set'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── EDIT MODE ─────────────────────────────────────────────────────────────────
function EditMode({ rows, setRows }) {
  const [saving, setSaving] = useState({})
  const [saved,  setSaved]  = useState({})

  const updateQty = useCallback((id, val) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, inventory: val, _dirty: true } : r))
    setSaved(prev => ({ ...prev, [id]: false }))
  }, [setRows])

  const saveRow = async (id) => {
    const row = rows.find(r => r.id === id)
    if (!row) return
    setSaving(prev => ({ ...prev, [id]: true }))
    const res = await fetch('/api/admin/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, inventory: row.inventory }),
    })
    const data = await res.json()
    setSaving(prev => ({ ...prev, [id]: false }))
    if (res.ok) {
      setRows(prev => prev.map(r => r.id === id
        ? { ...r, availability: data.availability, _dirty: false } : r))
      setSaved(prev => ({ ...prev, [id]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [id]: false })), 2000)
    } else {
      alert(data.error || 'Save failed')
    }
  }

  const saveAll = async () => {
    for (const row of rows.filter(r => r._dirty)) await saveRow(row.id)
  }

  const dirtyCount = rows.filter(r => r._dirty).length

  const grouped = {}
  rows.forEach(r => {
    const cat = r.category || 'Other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(r)
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary" style={{ padding: '0.6rem 1.75rem' }}
          onClick={saveAll} disabled={dirtyCount === 0}>
          {dirtyCount > 0 ? `💾 Save All (${dirtyCount})` : '✓ All Saved'}
        </button>
      </div>

      {Object.entries(grouped).map(([cat, catRows]) => (
        <div key={cat} className="inv-cat-block">
          <div className="inv-cat-header">{cat} <span>{catRows.length}</span></div>
          <div className="inv-table">
            {catRows.map(row => {
              const inv = row.inventory === '' || row.inventory == null ? '' : Number(row.inventory)
              const st  = availStatus(row)
              const isDirty   = !!row._dirty
              const isSaving  = !!saving[row.id]
              const justSaved = !!saved[row.id]
              return (
                <div key={row.id} className={`inv-row${isDirty ? ' inv-row-dirty' : ''}`}>
                  <div className="inv-info">
                    <div className="inv-name">{row.name}</div>
                    {row.sku && <div className="inv-sku">#{row.sku}</div>}
                  </div>
                  <div className={`inv-badge inv-badge-${st}`}>
                    {st === 'request' ? '🔴 Available on Request' : st === 'unknown' ? '— not set' : '🟢 Available'}
                  </div>
                  <div className="inv-qty-wrap">
                    <button className="inv-qty-btn" onClick={() => updateQty(row.id, Math.max(0, (Number(inv) || 0) - 1))}>−</button>
                    <input className="inv-qty-input" type="number" min="0"
                      value={row.inventory ?? ''} placeholder="qty"
                      onChange={e => updateQty(row.id, e.target.value === '' ? '' : e.target.value)} />
                    <button className="inv-qty-btn" onClick={() => updateQty(row.id, (Number(inv) || 0) + 1)}>+</button>
                  </div>
                  <button className={`inv-save-btn${justSaved ? ' inv-saved' : ''}`}
                    disabled={!isDirty || isSaving} onClick={() => saveRow(row.id)}>
                    {isSaving ? '…' : justSaved ? '✓' : isDirty ? 'Save' : '✓'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function InventoryPage({ initialProducts }) {
  const [rows, setRows] = useState(initialProducts)
  const [mode, setMode] = useState('edit') // 'edit' | 'view'
  const dirtyCount = rows.filter(r => r._dirty).length

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <h1>Arambhika Admin</h1>
        <nav className="admin-nav">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/products">Products</Link>
          <Link href="/admin/productsinventory" style={{ color: 'var(--accent)', fontWeight: 700 }}>Inventory</Link>
          <Link href="/admin/blogs">Blogs</Link>
          <Link href="/admin/categories">Categories</Link>
          <Link href="/admin/settings">Site Settings</Link>
          <Link href="/" target="_blank">View Site ↗</Link>
          <a href="/api/auth/logout" style={{ color: '#f87171' }}>Logout</a>
        </nav>
      </header>

      <div className="admin-content" style={{ maxWidth: 940, padding: '1.5rem' }}>
        {/* Header */}
        <div className="inv-page-header">
          <div>
            <h2 className="admin-page-title" style={{ marginBottom: '0.15rem' }}>
              Inventory
              {dirtyCount > 0 && mode === 'edit' && (
                <span style={{ fontSize: '0.82rem', color: '#f59e0b', marginLeft: '0.75rem', fontWeight: 400 }}>
                  ● {dirtyCount} unsaved
                </span>
              )}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
              {mode === 'edit'
                ? '0 = Available on Request  ·  Any number = Available  ·  Blank = not tracked'
                : 'Read-only snapshot of current stock status'}
            </p>
          </div>
          {/* Mode toggle */}
          <div className="inv-mode-toggle">
            <button className={`inv-mode-btn${mode === 'view' ? ' active' : ''}`} onClick={() => setMode('view')}>
              👁 View
            </button>
            <button className={`inv-mode-btn${mode === 'edit' ? ' active' : ''}`} onClick={() => setMode('edit')}>
              ✏️ Edit
            </button>
          </div>
        </div>

        {mode === 'view'
          ? <ViewMode rows={rows} />
          : <EditMode rows={rows} setRows={setRows} />}
      </div>
    </div>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session?.admin) return { redirect: { destination: '/admin', permanent: false } }
  const { getAllProductsSorted } = require('../../lib/db')
  const products = getAllProductsSorted()
  return {
    props: {
      initialProducts: products.map(p => ({
        id: p.id, name: p.name, sku: p.sku || '', category: p.category,
        inventory: p.inventory ?? '', availability: p.availability || 'in stock',
        unit: p.unit || '', _dirty: false,
      })),
    },
  }
}
