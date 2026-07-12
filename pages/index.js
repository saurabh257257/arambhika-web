import Link from 'next/link'
import Layout from '../components/Layout'
import { getAllProducts, getCategories } from '../lib/db'

export default function Home({ featured, categories }) {
  const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919315545821'

  return (
    <Layout>
      {/* Hero */}
      <section className="hero">
        <h1>Nickel Strips & Copper Busbars for Battery Manufacturers</h1>
        <p>Manufacturer and distributor based in Greater Noida. Serving EV, ESS, and battery pack makers across India.</p>
        <div className="hero-actions">
          <Link href="/store" className="btn btn-primary">Browse Products</Link>
          <a href={`https://wa.me/${WA}?text=Hi%2C%20I%20want%20to%20enquire%20about%20your%20products.`}
            className="btn btn-wa" target="_blank" rel="noopener noreferrer">
            WhatsApp Us
          </a>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="section-title">Product Categories</h2>
            <p className="section-sub">Click a category to browse products</p>
            <div className="category-grid">
              {categories.map(c => (
                <Link key={c.category} href={`/store?category=${encodeURIComponent(c.category)}`} className="cat-chip">
                  {c.category}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="section" style={{ background: 'var(--off)', padding: '4rem 0' }}>
          <div className="container">
            <h2 className="section-title">Featured Products</h2>
            <p className="section-sub">
              <Link href="/store" style={{ color: 'var(--accent)' }}>View all →</Link>
            </p>
            <div className="product-grid">
              {featured.map(p => {
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
                      <h3 className="product-card-name">
                        <Link href={`/store/${p.slug}`}>{p.name}</Link>
                      </h3>
                      {p.sku && <p className="product-card-sku">SKU: {p.sku}</p>}
                      {p.price && <p className="product-card-price">₹{p.price}/{p.unit || 'unit'}</p>}
                      <div className="product-card-footer">
                        <Link href={`/store/${p.slug}`} className="btn btn-primary btn-sm">View Details</Link>
                        <a href={`https://wa.me/${WA}?text=${encodeURIComponent(`Hi, I'm interested in ${p.name}${p.sku ? ` (${p.sku})` : ''}. Please share availability and pricing.`)}`}
                          className="btn btn-wa btn-sm" target="_blank" rel="noopener noreferrer">Order</a>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {featured.length === 0 && categories.length === 0 && (
        <section className="section">
          <div className="container">
            <div className="empty-state">
              <h3>Products coming soon</h3>
              <p>Add products from the admin panel to display them here.</p>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Need a custom quote?</h2>
          <p className="section-sub">Send us your specifications on WhatsApp — we'll respond within 2 hours.</p>
          <a href={`https://wa.me/${WA}?text=Hi%2C%20I%20need%20a%20custom%20quote%20for%20nickel%20strips%2Fcopper%20busbars.`}
            className="btn btn-wa" target="_blank" rel="noopener noreferrer" style={{ fontSize: '1.05rem', padding: '0.9rem 2.5rem' }}>
            Get Quote on WhatsApp
          </a>
        </div>
      </section>
    </Layout>
  )
}

export async function getServerSideProps() {
  try {
    const featured = getAllProducts().slice(0, 8)
    const categories = getCategories()
    return {
      props: {
        featured: featured.map(p => ({ ...p })),
        categories,
      },
    }
  } catch {
    return { props: { featured: [], categories: [] } }
  }
}
