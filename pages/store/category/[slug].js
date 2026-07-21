import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Layout from '../../../components/Layout'
import { loadQuote, saveQuote } from '../../../lib/quote'

export default function CategoryPage({ products, category, settings, siteUrl, categorySlug }) {
  const WA = settings.wa_number || '919315545821'
  const [quote, setQuote] = useState([])

  useEffect(() => { setQuote(loadQuote()) }, [])
  useEffect(() => { saveQuote(quote) }, [quote])

  const upsertQuote = useCallback((product, qty) => {
    setQuote(prev => {
      const idx = prev.findIndex(x => x.id === product.id)
      if (idx >= 0) {
        const next = [...prev]; next[idx] = { ...next[idx], qty }; return next
      }
      return [...prev, { ...product, qty }]
    })
  }, [])

  const canonicalUrl = `${siteUrl}/store/category/${categorySlug}`

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',  item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Store', item: `${siteUrl}/store` },
      { '@type': 'ListItem', position: 3, name: category, item: canonicalUrl },
    ],
  }

  return (
    <Layout
      title={`${category} Products`}
      description={`Buy ${category} from Arambhika Enablers — manufacturer and distributor in Greater Noida. ${products.length} products available. Get a quote on WhatsApp.`}
      ogUrl={canonicalUrl}
      canonical={canonicalUrl}
      settings={settings}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="container" style={{ padding: '1.5rem 1rem 4rem' }}>
        {/* Breadcrumb */}
        <div className="breadcrumb" style={{ marginBottom: '1.5rem' }}>
          <Link href="/">Home</Link><span>/</span>
          <Link href="/store">Store</Link><span>/</span>
          <span>{category}</span>
        </div>

        {/* Category header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
            {category}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
            {products.length} product{products.length !== 1 ? 's' : ''} · Arambhika Enablers, Greater Noida
          </p>
        </div>

        {/* Product grid */}
        {products.length === 0 ? (
          <div className="empty-state">
            <h3>No products in this category yet</h3>
            <p><Link href="/store">Browse all products</Link></p>
          </div>
        ) : (
          <div className="cat-page-grid">
            {products.map(p => {
              const images   = JSON.parse(p.images || '[]')
              const minQty   = Number(p.min_qty) || 1
              const inQuote  = quote.find(x => x.id === p.id)
              const qty      = inQuote ? inQuote.qty : minQty
              const availSt  = p.availability === 'out of stock' ? 'out'
                : p.availability === 'Available on Request' ? 'request' : 'in'

              return (
                <div key={p.id} className="cat-pcard">
                  <Link href={`/store/${p.slug}`} className="cat-pcard-img-link">
                    <div className="cat-pcard-img-wrap">
                      {images[0]
                        ? <img src={images[0]} alt={p.name} className="cat-pcard-img" loading="lazy" />
                        : <div className="cat-pcard-img-empty">{p.name.slice(0,2).toUpperCase()}</div>
                      }
                    </div>
                  </Link>

                  <div className="cat-pcard-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div>
                        {p.sku && <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>#{p.sku}</p>}
                        <Link href={`/store/${p.slug}`} style={{ textDecoration: 'none', color: 'var(--text)' }}>
                          <h2 className="cat-pcard-name">{p.name}</h2>
                        </Link>
                      </div>
                      <span className={`pcard-badge pcard-badge-${availSt}`} style={{ flexShrink: 0 }}>
                        {availSt === 'in' ? 'Available' : availSt === 'request' ? 'On Request' : 'Out of Stock'}
                      </span>
                    </div>

                    {p.price && (
                      <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--price)', margin: '0.5rem 0 0.25rem' }}>
                        ₹{p.price}<span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--muted)' }}>/{p.unit || 'unit'}</span>
                      </p>
                    )}
                    {p.min_qty && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                        Min Qty: {p.min_qty} {p.unit || ''}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div className="pcard-qty" style={{ flex: '0 0 auto' }}>
                        <button onClick={() => upsertQuote(p, Math.max(minQty, qty - 1))}>−</button>
                        <span>{qty} {p.unit || ''}</span>
                        <button onClick={() => upsertQuote(p, qty + 1)}>+</button>
                      </div>
                      <button
                        className={`pcard-add-btn${inQuote ? ' pcard-add-btn-in' : ''}`}
                        style={{ flex: 1 }}
                        onClick={() => upsertQuote(p, qty)}
                      >
                        {inQuote ? '✓ In Quote' : 'Add to Quote'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Quote summary bar */}
        {quote.length > 0 && (
          <div className="cat-quote-bar">
            <span>{quote.length} item{quote.length !== 1 ? 's' : ''} in quote</span>
            <a href={`https://wa.me/${WA}?text=${encodeURIComponent(
              `Hi, I'd like a quote:\n\n${quote.map(q => `• ${q.name}${q.sku ? ` (${q.sku})` : ''} — Qty: ${q.qty} ${q.unit || ''}`).join('\n')}`
            )}`} target="_blank" rel="noopener noreferrer" className="btn btn-wa" style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem' }}>
              Get Quote on WhatsApp
            </a>
            <Link href="/store" style={{ fontSize: '0.85rem', color: 'var(--muted)', textDecoration: 'none' }}>
              View all products
            </Link>
          </div>
        )}
      </div>
    </Layout>
  )
}

export async function getServerSideProps({ params }) {
  try {
    const { getAllProducts, getCategoryNames, getSettings } = require('../../../lib/db')
    const { fromCategorySlug } = require('../../../lib/categorySlug')

    const categoryNames = getCategoryNames()
    const category = fromCategorySlug(params.slug, categoryNames)
    if (!category) return { notFound: true }

    const products = getAllProducts(category)
    const settings = getSettings()
    const siteUrl  = process.env.SITE_URL || 'https://arambhikaenablers.in'

    return {
      props: {
        products: products.map(p => ({ ...p })),
        category,
        categorySlug: params.slug,
        settings,
        siteUrl,
      },
    }
  } catch {
    return { notFound: true }
  }
}
