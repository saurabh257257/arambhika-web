import { useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { getSession } from '../../../lib/session'

export default function NewBlog() {
  const router = useRouter()
  const fileRef = useRef(null)

  const [form, setForm] = useState({ title: '', excerpt: '', content: '' })
  const [coverImage, setCoverImage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (res.ok) setCoverImage(data.url)
    setUploading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const res = await fetch('/api/blogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, cover_image: coverImage }),
    })
    const data = await res.json()
    if (res.ok) {
      setSuccess('Post published!')
      setTimeout(() => router.push('/admin/blogs'), 1000)
    } else {
      setError(data.error || 'Failed to publish')
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
          <Link href="/admin/blogs" style={{ color: 'var(--accent)', fontSize: '0.88rem' }}>← Back to Blogs</Link>
        </div>
        <h2 className="admin-page-title">New Blog Post</h2>
        <p className="admin-page-sub">Write and publish a new article. Good blogs attract Google traffic.</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="admin-form" style={{ maxWidth: '800px' }}>
          {/* Cover image */}
          <div className="form-group">
            <label>Cover Image</label>
            <input type="file" ref={fileRef} accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} />
            <button type="button" className="btn-secondary" onClick={() => fileRef.current.click()} disabled={uploading}>
              {uploading ? 'Uploading...' : '+ Upload Cover Image'}
            </button>
            {coverImage && (
              <div style={{ marginTop: '0.75rem' }}>
                <img src={coverImage} alt="Cover" style={{ maxHeight: 200, borderRadius: 8, border: '1px solid var(--border)' }} />
                <p className="form-hint" style={{ wordBreak: 'break-all', marginTop: '0.4rem' }}>
                  Image link: <a href={coverImage} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{coverImage}</a>
                </p>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. How to choose nickel strip thickness for 18650 cells" />
          </div>

          <div className="form-group">
            <label>Excerpt (shown in blog list)</label>
            <textarea name="excerpt" value={form.excerpt} onChange={handleChange}
              placeholder="1-2 sentence summary of the post..." style={{ minHeight: 70 }} />
          </div>

          <div className="form-group">
            <label>Content *</label>
            <textarea name="content" value={form.content} onChange={handleChange} required
              placeholder="Write your full blog post here. You can use line breaks for paragraphs."
              style={{ minHeight: 400 }} />
            <p className="form-hint">Tip: Start headings with ## for H2 and ### for H3 — they will display as bold sections.</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-submit" disabled={saving || uploading}>
              {saving ? 'Publishing...' : 'Publish Post'}
            </button>
            <Link href="/admin/blogs" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session?.admin) return { redirect: { destination: '/admin', permanent: false } }
  return { props: {} }
}
