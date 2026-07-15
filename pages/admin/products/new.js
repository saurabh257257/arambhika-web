import { useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { getSession } from '../../../lib/session'

export default function NewProduct({ categories }) {
  const router = useRouter()
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    name: '', sku: '', category: '', price: '', unit: 'KG', min_qty: '', description: '',
  })
  const [isNewCat, setIsNewCat] = useState(false)
  const [specs, setSpecs] = useState([{ key: '', value: '' }])
  const [images, setImages] = useState([]) // uploaded paths
  const [previews, setPreviews] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const makePrefix = () => {
    const raw = (form.sku ? form.sku + '_' : '') + (form.name || 'product')
    return raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 50)
  }

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    const newPaths = []
    const newPreviews = []
    const prefix = makePrefix()
    let idx = images.length + 1
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('prefix', prefix)
      fd.append('imgIndex', String(idx++))
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        newPaths.push(data.url)
        newPreviews.push(data.url)
      }
    }
    setImages(i => [...i, ...newPaths])
    setPreviews(p => [...p, ...newPreviews])
    setUploading(false)
  }

  const addSpec = () => setSpecs(s => [...s, { key: '', value: '' }])
  const removeSpec = (i) => setSpecs(s => s.filter((_, idx) => idx !== i))
  const updateSpec = (i, field, val) => setSpecs(s => s.map((sp, idx) => idx === i ? { ...sp, [field]: val } : sp))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.category) {
      setError('Please select or enter a category')
      return
    }
    setError('')
    setSaving(true)
    const validSpecs = specs.filter(s => s.key && s.value)
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, specs: validSpecs, images }),
    })
    const data = await res.json()
    if (res.ok) {
      setSuccess('Product added! Redirecting...')
      setTimeout(() => router.push('/admin/products'), 1000)
    } else {
      setError(data.error || 'Failed to save product')
      setSaving(false)
    }
  }

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

      <div className="admin-content">
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/admin/products" style={{ color: 'var(--accent)', fontSize: '0.88rem' }}>← Back to Products</Link>
        </div>
        <h2 className="admin-page-title">Add New Product</h2>
        <p className="admin-page-sub">Fill in the details below. All fields except name are optional.</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          {/* Images first */}
          <div className="form-group">
            <label>Product Images</label>
            <input type="file" ref={fileRef} accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
            <button type="button" className="btn-secondary" onClick={() => fileRef.current.click()} disabled={uploading}>
              {uploading ? 'Uploading...' : '+ Upload Images'}
            </button>
            <p className="form-hint">Upload up to 5 images. First image will be the main display image.</p>
            {previews.length > 0 && (
              <div className="img-previews">
                {previews.map((src, i) => (
                  <div key={i} className="img-preview">
                    <img src={src} alt={`Preview ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
            {images.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                {images.map((url, i) => (
                  <p key={i} className="form-hint" style={{ wordBreak: 'break-all' }}>
                    Image {i + 1} link: <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{url}</a>
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Product Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Nickel Strip Plated 1P 6x0.15 mm" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>SKU</label>
              <input name="sku" value={form.sku} onChange={handleChange} placeholder="e.g. NPT1" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={isNewCat ? '__new__' : form.category} onChange={e => {
                if (e.target.value === '__new__') { setIsNewCat(true); setForm(f => ({ ...f, category: '' })) }
                else { setIsNewCat(false); setForm(f => ({ ...f, category: e.target.value })) }
              }} required={!isNewCat}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__new__">+ New category…</option>
              </select>
              {isNewCat && (
                <input
                  name="category"
                  style={{ marginTop: '0.5rem' }}
                  value={form.category}
                  placeholder="Type new category name"
                  onChange={handleChange}
                  required
                />
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (₹)</label>
              <input name="price" value={form.price} onChange={handleChange} placeholder="e.g. 480" />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select name="unit" value={form.unit} onChange={handleChange}>
                <option value="KG">KG</option>
                <option value="Piece">Piece</option>
                <option value="Meter">Meter</option>
                <option value="Roll">Roll</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Minimum Order Quantity</label>
            <input name="min_qty" value={form.min_qty} onChange={handleChange} placeholder="e.g. 4" />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Brief product description..." />
          </div>

          {/* Specs */}
          <div className="form-group">
            <label>Specifications</label>
            <div className="specs-editor">
              {specs.map((s, i) => (
                <div key={i} className="spec-row">
                  <input value={s.key} onChange={e => updateSpec(i, 'key', e.target.value)} placeholder="Property (e.g. Width)" />
                  <input value={s.value} onChange={e => updateSpec(i, 'value', e.target.value)} placeholder="Value (e.g. 6mm)" />
                  {specs.length > 1 && (
                    <button type="button" className="btn-remove-spec" onClick={() => removeSpec(i)}>×</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn-add-spec" onClick={addSpec}>+ Add specification</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-submit" disabled={saving || uploading}>
              {saving ? 'Saving...' : 'Save Product'}
            </button>
            <Link href="/admin/products" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session?.admin) return { redirect: { destination: '/admin', permanent: false } }
  const { getDb } = require('../../../lib/db')
  const db = getDb()
  const rows = db.prepare('SELECT DISTINCT category FROM products WHERE active=1 ORDER BY category').all()
  const categories = rows.map(r => r.category)
  return { props: { categories } }
}
