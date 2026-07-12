import Link from 'next/link'
import { useRouter } from 'next/router'
import { getSession } from '../../../lib/session'
import { getAllProducts } from '../../../lib/db'

export default function AdminProducts({ products }) {
  const router = useRouter()

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
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
            <h2 className="admin-page-title">Products</h2>
            <p className="admin-page-sub">{products.length} product{products.length !== 1 ? 's' : ''} total</p>
          </div>
          <Link href="/admin/products/new" className="btn btn-primary">+ Add Product</Link>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <h3>No products yet</h3>
            <p>Add your first product to start selling.</p>
            <br />
            <Link href="/admin/products/new" className="btn btn-primary">Add First Product</Link>
          </div>
        ) : (
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name / SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const images = JSON.parse(p.images || '[]')
                  return (
                    <tr key={p.id}>
                      <td>
                        {images[0]
                          ? <img src={images[0]} alt={p.name} className="table-img" />
                          : <div className="table-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.75rem' }}>—</div>
                        }
                      </td>
                      <td>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</p>
                        {p.sku && <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>SKU: {p.sku}</p>}
                      </td>
                      <td><span className="badge badge-cat">{p.category}</span></td>
                      <td style={{ fontWeight: 600 }}>{p.price ? `₹${p.price}/${p.unit}` : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <Link href={`/admin/products/edit/${p.id}`} className="btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}>Edit</Link>
                          <Link href={`/store/${p.slug}`} target="_blank" className="btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}>View ↗</Link>
                          <button onClick={() => handleDelete(p.id, p.name)} className="btn-danger">Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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
    const products = getAllProducts()
    return { props: { products: products.map(p => ({ ...p })) } }
  } catch {
    return { props: { products: [] } }
  }
}
