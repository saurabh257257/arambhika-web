import Link from 'next/link'
import { useRouter } from 'next/router'
import { getSession } from '../../../lib/session'
import { getAllBlogs } from '../../../lib/db'

export default function AdminBlogs({ blogs }) {
  const router = useRouter()

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return
    await fetch(`/api/blogs/${id}`, { method: 'DELETE' })
    router.replace(router.asPath)
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 className="admin-page-title">Blog Posts</h2>
            <p className="admin-page-sub">{blogs.length} post{blogs.length !== 1 ? 's' : ''} published</p>
          </div>
          <Link href="/admin/blogs/new" className="btn btn-primary">+ New Post</Link>
        </div>

        {blogs.length === 0 ? (
          <div className="empty-state">
            <h3>No blog posts yet</h3>
            <p>Publish your first article to attract customers via search.</p>
            <br />
            <Link href="/admin/blogs/new" className="btn btn-primary">Write First Post</Link>
          </div>
        ) : (
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Title</th>
                  <th>Published</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map(b => (
                  <tr key={b.id}>
                    <td>
                      {b.cover_image
                        ? <img src={b.cover_image} alt={b.title} className="table-img" />
                        : <div className="table-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>—</div>
                      }
                    </td>
                    <td>
                      <p style={{ fontWeight: 600 }}>{b.title}</p>
                      {b.excerpt && <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{b.excerpt.slice(0, 80)}…</p>}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                      {new Date(b.published_at).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link href={`/blogs/${b.slug}`} target="_blank" className="btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}>View ↗</Link>
                        <button onClick={() => handleDelete(b.id, b.title)} className="btn-danger">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session?.admin) return { redirect: { destination: '/admin', permanent: false } }
  try {
    const blogs = getAllBlogs()
    return { props: { blogs: blogs.map(b => ({ ...b })) } }
  } catch {
    return { props: { blogs: [] } }
  }
}
