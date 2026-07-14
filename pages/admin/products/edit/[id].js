import { useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { getSession } from '../../../../lib/session'

const CATEGORIES = [
  'Nickel Strip Plated', 'Nickel Strip Pure', 'Copper Busbar',
  'Nickel Strip Plated with Holder', 'Nickel Strip Pure with Holder', 'Cell', 'Other',
]

export default function EditProduct({ product }) {
  const router = useRouter()
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    name: product.name || '', sku: product.sku || '', category: product.category || '',
    price: product.price || '', unit: product.unit || 'KG',
    min_qty: product.min_qty || '', description: product.description || '',
  })
  const [specs, setSpecs] = useState(
    JSON.parse(product.specs || '[]').length ? JSON.parse(product.specs) : [{ key: '', value: '' }]
  )
  const [images, setImages] = useState(JSON.parse(product.images || '[]'))
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
    const prefix = makePrefix()
    let idx = images.length + 1
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('prefix', prefix)
      fd.append('imgIndex', String(idx++))
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) newPaths.push(data.url)
    }
    setImages(i => [...i, ...newPaths])
    setUploading(false)
  }

  const removeImage = (idx) => setImages(i => i.filter((_, n) => n !== idx))
  const addSpec = () => setSpecs(s => [...s, { key: '', value: '' }])
  const removeSpec = (i) => setSpecs(s => s.filter((_, idx) => idx !== i))
  const updateSpec = (i, field, val) => setSpecs(s => s.map((sp, idx) => idx === i ? { ...sp, [field]: val } : sp))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, specs: specs.filter(s => s.key && s.value), images }),
    })
    const data = await res.json()
    if (res.ok) {
      setSuccess('Saved! Redirecting...')
      setTimeout(() => router.push('/admin/products'), 1000)
    } else {
      setError(data.error || 'Failed to save')
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
        <h2 className="admin-page-title">Edit Product</h2>
        <p className="admin-page-sub">Update product details below. Changes are saved immediately.</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Product Images</label>
            <input type="file" ref={fileRef} accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
            <button type="button" className="btn-secondary" onClick={() => fileRef.current.click()} disabled={uploading}>
              {uploading ? 'Uploading...' : '+ Add More Images'}
            </button>
            {images.length > 0 && (
              <div className="img-previews" style={{ marginTop: '0.75rem' }}>
                {images.map((src, i) => (
                  <div key={i} className="img-preview">
                    <img src={src} alt={`Image ${i + 1}`} />
                    <button type="button" onClick={() => removeImage(i)} className="img-remove-btn">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Product Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>SKU</label>
              <input name="sku" value={form.sku} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange} required>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
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
            <textarea name="description" value={form.description} onChange={handleChange} />
          </div>

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
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/admin/products" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export async function getServerSideProps({ req, res, params }) {
  const session = await getSession(req, res)
  if (!session?.admin) return { redirect: { destination: '/admin', permanent: false } }
  try {
    const { getProductById } = require('../../../../lib/db')
    const product = getProductById(Number(params.id))
    if (!product) return { notFound: true }
    return { props: { product: { ...product } } }
  } catch {
    return { notFound: true }
  }
}
