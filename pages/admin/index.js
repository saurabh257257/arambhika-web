import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { getSession } from '../../lib/session'
import { getAllProducts, getAllBlogs } from '../../lib/db'

export default function AdminDashboard({ isLoggedIn, error, stats }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState(error || '')
  const router = useRouter()

  if (!isLoggedIn) {
    const handleLogin = async (e) => {
      e.preventDefault()
      setLoading(true)
      setLoginError('')
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (res.ok) {
        router.reload()
      } else {
        setLoginError(data.error || 'Login failed')
        setLoading(false)
      }
    }

    return (
      <div className="admin-login">
        <div className="login-card">
          <h2>Admin Login</h2>
          <p>Arambhika Enablers — CMS</p>
          {loginError && <div className="alert alert-error">{loginError}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-submit" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
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
        <h2 className="admin-page-title">Dashboard</h2>
        <p className="admin-page-sub">Overview of your site content</p>

        <div className="admin-cards">
          <div className="admin-stat">
            <p className="admin-stat-num">{stats.products}</p>
            <p className="admin-stat-label">Products</p>
          </div>
          <div className="admin-stat">
            <p className="admin-stat-num">{stats.blogs}</p>
            <p className="admin-stat-label">Blog Posts</p>
          </div>
        </div>

        <div className="admin-quick-links">
          <Link href="/admin/products/new" className="btn btn-primary">+ Add Product</Link>
          <Link href="/admin/blogs/new" className="btn btn-primary">+ New Blog Post</Link>
          <Link href="/admin/products" className="btn-secondary">Manage Products</Link>
          <Link href="/admin/blogs" className="btn-secondary">Manage Blogs</Link>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session?.admin) {
    return { props: { isLoggedIn: false, stats: { products: 0, blogs: 0 } } }
  }
  try {
    const products = getAllProducts()
    const blogs = getAllBlogs()
    return {
      props: {
        isLoggedIn: true,
        stats: { products: products.length, blogs: blogs.length },
      },
    }
  } catch {
    return { props: { isLoggedIn: true, stats: { products: 0, blogs: 0 } } }
  }
}
