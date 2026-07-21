import { useState, useCallback } from 'react'
import Link from 'next/link'
import { getSession } from '../../lib/session'

export default function InventoryPage({ initialProducts }) {
  const [rows, setRows] = useState(initialProducts)
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})

  const updateQty = useCallback((id, val) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, inventory: val, _dirty: true } : r))
    setSaved(prev => ({ ...prev, [id]: false }))
  }, [])

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
    const dirty = rows.filter(r => r._dirty)
    for (const row of dirty) await saveRow(row.id)
  }

  const dirtyCount = rows.filter(r => r._dirty).length

  // Group by category
  const grouped = {}
  rows.forEach(r => {
    const cat = r.category || 'Other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(r)
  })

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

      <div className="admin-content" style={{ maxWidth: 860, padding: '1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="admin-page-title" style={{ marginBottom: '0.2rem' }}>
              Daily Inventory Update
              {dirtyCount > 0 && (
                <span style={{ fontSize: '0.82rem', color: '#f59e0b', marginLeft: '0.75rem', fontWeight: 400 }}>
                  ● {dirtyCount} unsaved
                </span>
              )}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.83rem' }}>
              Enter quantity for each product. 0 = <strong>Available on Request</strong> · Any number = <strong>Available</strong>
            </p>
          </div>
          <button className="btn btn-primary" style={{ padding: '0.65rem 1.75rem' }}
            onClick={saveAll} disabled={dirtyCount === 0}>
            {dirtyCount > 0 ? `💾 Save All (${dirtyCount})` : '✓ All Saved'}
          </button>
        </div>

        {/* Product list grouped by category */}
        {Object.entries(grouped).map(([cat, catRows]) => (
          <div key={cat} className="inv-cat-block">
            <div className="inv-cat-header">{cat} <span>{catRows.length}</span></div>
            <div className="inv-table">
              {catRows.map(row => {
                const inv = row.inventory === '' || row.inventory == null ? '' : Number(row.inventory)
                const isOOS = inv === 0
                const isDirty = !!row._dirty
                const isSaving = !!saving[row.id]
                const justSaved = !!saved[row.id]

                return (
                  <div key={row.id} className={`inv-row${isDirty ? ' inv-row-dirty' : ''}`}>
                    {/* Product info */}
                    <div className="inv-info">
                      <div className="inv-name">{row.name}</div>
                      {row.sku && <div className="inv-sku">#{row.sku}</div>}
                    </div>

                    {/* Availability badge */}
                    <div className={`inv-badge ${isOOS ? 'inv-oor' : inv === '' ? 'inv-unknown' : 'inv-avail'}`}>
                      {isOOS
                        ? '🔴 Available on Request'
                        : inv === ''
                          ? '— not set'
                          : `🟢 Available`}
                    </div>

                    {/* Quantity input */}
                    <div className="inv-qty-wrap">
                      <button className="inv-qty-btn" onClick={() => updateQty(row.id, Math.max(0, (Number(inv) || 0) - 1))}>−</button>
                      <input
                        className="inv-qty-input"
                        type="number" min="0"
                        value={row.inventory ?? ''}
                        placeholder="qty"
                        onChange={e => updateQty(row.id, e.target.value === '' ? '' : e.target.value)}
                      />
                      <button className="inv-qty-btn" onClick={() => updateQty(row.id, (Number(inv) || 0) + 1)}>+</button>
                    </div>

                    {/* Save button */}
                    <button
                      className={`inv-save-btn${justSaved ? ' inv-saved' : ''}`}
                      disabled={!isDirty || isSaving}
                      onClick={() => saveRow(row.id)}>
                      {isSaving ? '…' : justSaved ? '✓ Saved' : isDirty ? 'Save' : '✓'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
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
      })),
    },
  }
}
