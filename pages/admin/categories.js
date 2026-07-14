import { useState, useRef } from 'react'
import Link from 'next/link'
import { getSession } from '../../lib/session'

export default function AdminCategories({ initialCategories }) {
  const [cats, setCats]   = useState(initialCategories)
  const [saving, setSaving] = useState(null) // category name being saved
  const [msg, setMsg]     = useState('')
  const fileRefs = useRef({})

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

    const url = d.url
    // Save to DB
    await fetch('/api/admin/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: { name: catName, url } }),
    })
    setCats(prev => prev.map(c => c.category === catName ? { ...c, image: url } : c))
    setSaving(null)
    input.value = ''
    setMsg(`✓ Image updated for "${catName}"`)
    setTimeout(() => setMsg(''), 3000)
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

      <div className="admin-content" style={{ maxWidth: 820, padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 className="admin-page-title" style={{ marginBottom: 0 }}>Category Images</h2>
          {msg && <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.875rem' }}>{msg}</span>}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Images appear on the homepage category grid and store filter bar. Recommended: square image, min 300×300px.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {cats.map(c => (
            <div key={c.category} className="cat-img-row">
              {/* Preview */}
              <div className="cat-img-preview">
                {c.image
                  ? <img src={c.image} alt={c.category} />
                  : <div className="cat-img-empty">No image</div>}
              </div>

              {/* Name */}
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '0.95rem' }}>{c.category}</strong>
                <br />
                {c.image && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', wordBreak: 'break-all' }}>{c.image}</span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                <input
                  type="file" accept="image/*" style={{ display: 'none' }}
                  ref={el => fileRefs.current[c.category] = el}
                  onChange={() => uploadImage(c.category)}
                />
                <button className="btn btn-primary btn-sm"
                  disabled={saving === c.category}
                  onClick={() => fileRefs.current[c.category]?.click()}>
                  {saving === c.category ? 'Uploading…' : c.image ? '↑ Replace' : '+ Upload'}
                </button>
                {c.image && (
                  <button className="pg-del-btn" onClick={() => removeImage(c.category)}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {cats.length === 0 && (
          <div className="empty-state">
            <h3>No categories yet</h3>
            <p>Add products first — categories appear automatically.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session?.admin) return { redirect: { destination: '/admin', permanent: false } }
  const { getCategoriesOrdered } = require('../../lib/db')
  const cats = getCategoriesOrdered()
  return { props: { initialCategories: cats.map(c => ({ ...c })) } }
}
