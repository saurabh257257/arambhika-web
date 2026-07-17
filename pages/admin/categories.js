import { useState, useRef } from 'react'
import Link from 'next/link'
import { getSession } from '../../lib/session'

export default function AdminCategories({ initialCategories }) {
  const [cats, setCats]       = useState(initialCategories)
  const [saving, setSaving]   = useState(null)
  const [msg, setMsg]         = useState('')
  const [newName, setNewName] = useState('')
  const [adding, setAdding]   = useState(false)
  const fileRefs = useRef({})

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const addCategory = async () => {
    if (!newName.trim()) return
    setAdding(true)
    const r = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const d = await r.json()
    setAdding(false)
    if (!r.ok) { alert(d.error || 'Failed'); return }
    setCats(prev => [...prev, { category: newName.trim(), product_count: 0, image: null }])
    setNewName('')
    flash(`✓ Category "${newName.trim()}" added`)
  }

  const deleteCategory = async (catName) => {
    if (!confirm(`Delete category "${catName}"? Only empty categories can be deleted.`)) return
    const r = await fetch('/api/admin/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: catName }),
    })
    const d = await r.json()
    if (!r.ok) { alert(d.error || 'Cannot delete — category has products'); return }
    setCats(prev => prev.filter(c => c.category !== catName))
    flash(`✓ Category "${catName}" deleted`)
  }

  const uploadImage = async (catName) => {
    const input = fileRefs.current[catName]
    if (!input?.files[0]) return
    setSaving(catName)
    const fd = new FormData()
    fd.append('file', input.files[0])
    fd.append('prefix', catName.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30))
    fd.append('imgIndex', '1')
    const r = await fetch('/api/upload', { method: 'POST', body: fd })
    const d = await r.json()
    if (!r.ok) { alert(d.error || 'Upload failed'); setSaving(null); return }
    await fetch('/api/admin/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: { name: catName, url: d.url } }),
    })
    setCats(prev => prev.map(c => c.category === catName ? { ...c, image: d.url } : c))
    setSaving(null)
    input.value = ''
    flash(`✓ Image updated for "${catName}"`)
  }

  const removeImage = async (catName) => {
    await fetch('/api/admin/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: { name: catName, url: '' } }),
    })
    setCats(prev => prev.map(c => c.category === catName ? { ...c, image: '' } : c))
  }

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <h1>Arambhika Admin</h1>
        <nav className="admin-nav">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/products">Products</Link>
          <Link href="/admin/blogs">Blogs</Link>
          <Link href="/admin/categories" style={{ color: 'var(--accent)', fontWeight: 700 }}>Categories</Link>
          <Link href="/admin/settings">Site Settings</Link>
          <Link href="/" target="_blank">View Site ↗</Link>
          <a href="/api/auth/logout" style={{ color: '#f87171' }}>Logout</a>
        </nav>
      </header>

      <div className="admin-content" style={{ maxWidth: 860, padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 className="admin-page-title" style={{ marginBottom: 0 }}>
            Categories <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--muted)' }}>({cats.length})</span>
          </h2>
          {msg && <span style={{ color: msg.startsWith('✓') ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: '0.875rem' }}>{msg}</span>}
        </div>

        {/* Add new category */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <input
            className="settings-input"
            style={{ flex: 1, maxWidth: 320 }}
            value={newName}
            placeholder="New category name…"
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCategory()}
          />
          <button className="btn btn-primary" onClick={addCategory} disabled={adding || !newName.trim()}>
            {adding ? 'Adding…' : '+ Add Category'}
          </button>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
          Images appear on the homepage category grid and store filter bar. Recommended: square, min 300×300 px.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {cats.map(c => (
            <div key={c.category} className="cat-img-row">
              {/* Preview */}
              <div className="cat-img-preview">
                {c.image
                  ? <img src={c.image} alt={c.category} />
                  : <div className="cat-img-empty">No image</div>}
              </div>

              {/* Name + count */}
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '0.95rem' }}>{c.category}</strong>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.78rem', color: 'var(--muted)' }}>
                  {c.product_count > 0 ? `${c.product_count} product${c.product_count !== 1 ? 's' : ''}` : 'no products yet'}
                </span>
                {c.image && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', wordBreak: 'break-all', marginTop: 2 }}>{c.image}</span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  ref={el => fileRefs.current[c.category] = el}
                  onChange={() => uploadImage(c.category)} />
                <button className="btn btn-primary btn-sm"
                  disabled={saving === c.category}
                  onClick={() => fileRefs.current[c.category]?.click()}>
                  {saving === c.category ? 'Uploading…' : c.image ? '↑ Replace' : '+ Image'}
                </button>
                {c.image && (
                  <button className="pg-del-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => removeImage(c.category)}>Remove img</button>
                )}
                {c.product_count === 0 && (
                  <button className="pg-del-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => deleteCategory(c.category)}>✕ Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {cats.length === 0 && (
          <div className="empty-state">
            <h3>No categories yet</h3>
            <p>Add a category above or add products — categories appear automatically.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session?.admin) return { redirect: { destination: '/admin', permanent: false } }
  const { getCategoriesOrdered, getCategoryNames } = require('../../lib/db')
  const withProducts = getCategoriesOrdered()
  const allNames = getCategoryNames()
  const withProductsSet = new Set(withProducts.map(c => c.category))
  const empty = allNames
    .filter(n => !withProductsSet.has(n))
    .map(n => ({ category: n, product_count: 0, image: null }))
  return { props: { initialCategories: [...withProducts, ...empty].map(c => ({ ...c })) } }
}
