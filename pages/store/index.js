import Link from 'next/link'
import Layout from '../../components/Layout'
import { getAllProducts, getCategories } from '../../lib/db'

export default function Store({ products, categories, activeCategory }) {
  const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919315545821'

  return (
    <Layout title="Product Store" description="Browse our full catalog of nickel strips, copper busbars, and battery connectors.">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Store</span>
          {activeCategory && (<><span>/</span><span>{activeCategory}</span></>)}
        </div>

        <section className="section">
          <h1 className="section-title">Product Store</h1>
          <p className="section-sub">{products.length} product{products.length !== 1 ? 's' : ''}{activeCategory ? ` in ${activeCategory}` : ''}</p>

          {/* Category filters — server-rendered, no JS */}
          <div className="category-grid" style={{ marginBottom: '2rem' }}>
            <Link href="/store" className={`cat-chip${!activeCategory ? ' active' : ''}`}>All</Link>
            {categories.map(c => (
              <Link key={c.category} href={`/store?category=${encodeURIComponent(c.category)}`}
                className={`cat-chip${activeCategory === c.category ? ' active' : ''}`}>
                {c.category}
              </Link>
            ))}
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <h3>No products yet</h3>
              <p>Add products from the <Link href="/admin/products">admin panel</Link>.</p>
            </div>
          ) : (
            <div className="product-grid">
              {products.map(p => {
                const images = JSON.parse(p.images || '[]')
                return (
                  <article key={p.id} className="product-card">
                    <Link href={`/store/${p.slug}`}>
                      {images[0]
                        ? <img src={images[0]} alt={p.name} className="product-card-img" loading="lazy" />
                        : <div className="product-card-img-placeholder">No image</div>
                      }
                    </Link>
                    <div className="product-card-body">
                      <p className="product-card-cat">{p.category}</p>
                      <h2 className="product-card-name">
                        <Link href={`/store/${p.slug}`}>{p.name}</Link>
                      </h2>
                      {p.sku && <p className="product-card-sku">SKU: {p.sku}</p>}
                      {p.price && <p className="product-card-price">₹{p.price}/{p.unit || 'unit'}</p>}
                      {p.min_qty && <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>Min Qty: {p.min_qty} {p.unit}</p>}
                      <div className="product-card-footer">
                        <Link href={`/store/${p.slug}`} className="btn btn-primary btn-sm">View Details</Link>
                        <a href={`https://wa.me/${WA}?text=${encodeURIComponent(`Hi, I'm interested in ${p.name}${p.sku ? ` (${p.sku})` : ''}. Please share pricing and availability.`)}`}
                          className="btn btn-wa btn-sm" target="_blank" rel="noopener noreferrer">Order</a>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}

export async function getServerSideProps({ query }) {
  try {
    const category = query.category || null
    const products = getAllProducts(category)
    const categories = getCategories()
    return {
      props: {
        products: products.map(p => ({ ...p })),
        categories,
        activeCategory: category,
      },
    }
  } catch {
    return { props: { products: [], categories: [], activeCategory: null } }
  }
}
