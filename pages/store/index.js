import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '../../components/Layout'

const WA = '919315545821'

/* ── Product card ── */
function ProductCard({ p, onAddToQuote }) {
  const images = JSON.parse(p.images || '[]')
  const [imgIdx, setImgIdx] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [qty, setQty] = useState(Number(p.min_qty) || 1)
  const minQty = Number(p.min_qty) || 1

  return (
    <article className="sc-card">
      {/* Clickable image → real product page */}
      <Link href={`/store/${p.slug}`} className="sc-img-wrap">
        {images.length > 0 ? (
          <>
            <img src={images[imgIdx]} alt={p.name} className="sc-img" loading="lazy" />
            {images.length > 1 && (
              <>
                <button className="sc-arrow sc-arrow-l" onClick={e => { e.preventDefault(); e.stopPropagation(); setImgIdx(i => (i - 1 + images.length) % images.length) }}>&#8249;</button>
                <button className="sc-arrow sc-arrow-r" onClick={e => { e.preventDefault(); e.stopPropagation(); setImgIdx(i => (i + 1) % images.length) }}>&#8250;</button>
                <div className="sc-dots">
                  {images.map((_, i) => (
                    <span key={i} className={`sc-dot${i === imgIdx ? ' active' : ''}`} onClick={e => { e.preventDefault(); e.stopPropagation(); setImgIdx(i) }} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="sc-img-empty">No image</div>
        )}
      </Link>

      <div className="sc-body">
        <div className="sc-top-row">
          <div className="sc-info">
            {/* Product name → real product page */}
            <Link href={`/store/${p.slug}`} className="sc-name-link">
              <h2 className="sc-name">
                {p.name}
                {p.sku && <span className="sc-sku"> ({p.sku})</span>}
              </h2>
            </Link>
            {p.description && <p className="sc-sub">{p.description.slice(0, 80)}</p>}
            <div className="sc-meta-row">
              {p.price && <span className="sc-price">Price: ₹{p.price}/{p.unit || 'unit'}</span>}
              {p.min_qty && <span className="sc-minqty">Min Qty: {p.min_qty} {p.unit || ''}</span>}
            </div>
          </div>
          <span className="sc-avail">Available</span>
        </div>

        <button className="sc-expand" onClick={() => setExpanded(v => !v)}>
          <span className="sc-expand-icon">{expanded ? '−' : '+'}</span>
          More details
        </button>
        {expanded && p.description && <p className="sc-desc">{p.description}</p>}

        <div className="sc-actions">
          <div className="sc-qty">
            <button onClick={() => setQty(q => Math.max(minQty, q - 1))}>−</button>
            <span>{qty} {p.unit || 'unit'}</span>
            <button onClick={() => setQty(q => q + 1)}>+</button>
          </div>
          <button className="sc-add-btn" onClick={() => onAddToQuote({ ...p, qty })}>
            Add to Quote
          </button>
        </div>
      </div>
    </article>
  )
}

/* ── Main store page ── */
export default function Store({ products, categories, activeCategory }) {
  const [search, setSearch] = useState('')
  const [quote, setQuote] = useState([])
  const [mobile, setMobile] = useState('')
  const [showQuote, setShowQuote] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('arambhika_quote')
      if (saved) setQuote(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('arambhika_quote', JSON.stringify(quote)) } catch {}
  }, [quote])

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return !q || p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
  })

  function addToQuote(item) {
    setQuote(prev => {
      const idx = prev.findIndex(x => x.id === item.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: item.qty }
        return next
      }
      return [...prev, item]
    })
  }

  function proceedWhatsApp() {
    if (!mobile) { alert('Please enter your mobile number'); return }
    if (quote.length === 0) { alert('Add at least one product to your quote'); return }
    const lines = quote.map(q => `• ${q.name}${q.sku ? ` (${q.sku})` : ''} — Qty: ${q.qty} ${q.unit || ''}`)
    const msg = `Hi, I'd like a quote:\n\n${lines.join('\n')}\n\nMy number: +91${mobile}`
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <Layout title="Product Store" description="Browse our full catalog of nickel strips, copper busbars, and battery connectors.">
      <div className="sc-searchbar-wrap">
        <input className="sc-searchbar" type="text" placeholder="Search products..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="sc-layout">
        <aside className="sc-sidebar">
          <h3 className="sc-sidebar-title">Categories</h3>
          <Link href="/store" className={`sc-cat-item${!activeCategory ? ' active' : ''}`}>All</Link>
          {categories.map(c => (
            <Link key={c.category} href={`/store?category=${encodeURIComponent(c.category)}`}
              className={`sc-cat-item${activeCategory === c.category ? ' active' : ''}`}>
              {c.category}
            </Link>
          ))}
        </aside>

        <main className="sc-main">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>{search ? 'Try a different search term.' : <>Add products from the <Link href="/admin/products">admin panel</Link>.</>}</p>
            </div>
          ) : filtered.map(p => (
            <ProductCard key={p.id} p={p} onAddToQuote={addToQuote} />
          ))}
        </main>

        <aside className="sc-quote-panel">
          <div className="sc-quote-header">
            <span className="sc-quote-title">View Quote</span>
            <button className="sc-quote-clear" onClick={() => setQuote([])}>Clear</button>
          </div>
          {quote.length === 0 ? (
            <p className="sc-quote-empty">No items added yet. Click "Add to Quote" on any product.</p>
          ) : (
            <ul className="sc-quote-list">
              {quote.map(item => (
                <li key={item.id} className="sc-quote-item">
                  <div>
                    <strong>{item.name}</strong>
                    {item.sku && <span className="sc-quote-sku"> ({item.sku})</span>}
                    <br />
                    <span className="sc-quote-qty">{item.qty} {item.unit || 'unit'}</span>
                  </div>
                  <button className="sc-quote-remove" onClick={() => setQuote(q => q.filter(x => x.id !== item.id))}>✕</button>
                </li>
              ))}
            </ul>
          )}
          <div className="sc-quote-mobile-wrap">
            <label className="sc-phone-label">Mobile Number</label>
            <div className="sc-phone-cc">IN India (+91)</div>
            <input className="sc-phone-input" type="tel" placeholder="Mobile number"
              value={mobile} onChange={e => setMobile(e.target.value)} />
          </div>
          <button className="sc-proceed-btn" onClick={proceedWhatsApp}>Proceed</button>
          <p className="sc-proceed-hint">Opens WhatsApp with your quote details.</p>
        </aside>
      </div>

      <button className="sc-float-btn" onClick={() => setShowQuote(v => !v)}>
        View Quote ({quote.length})
      </button>

      {showQuote && (
        <div className="mobile-quote-drawer">
          <div className="mobile-quote-header">
            <span className="sc-quote-title">View Quote</span>
            <button onClick={() => setShowQuote(false)} className="sc-quote-clear">✕ Close</button>
          </div>
          {quote.length === 0 ? (
            <p className="sc-quote-empty">No items yet.</p>
          ) : (
            <ul className="sc-quote-list">
              {quote.map(item => (
                <li key={item.id} className="sc-quote-item">
                  <div>
                    <strong>{item.name}</strong><br />
                    <span className="sc-quote-qty">{item.qty} {item.unit || 'unit'}</span>
                  </div>
                  <button className="sc-quote-remove" onClick={() => setQuote(q => q.filter(x => x.id !== item.id))}>✕</button>
                </li>
              ))}
            </ul>
          )}
          <input className="sc-phone-input" type="tel" placeholder="Mobile number"
            value={mobile} onChange={e => setMobile(e.target.value)} style={{ marginTop: '0.75rem' }} />
          <button className="sc-proceed-btn" style={{ marginTop: '0.5rem' }} onClick={proceedWhatsApp}>Proceed on WhatsApp</button>
        </div>
      )}

    </Layout>
  )
}

export async function getServerSideProps({ query }) {
  try {
    const { getAllProductsSorted, getCategoriesOrdered } = require('../../lib/db')
    const activeCategory = query.category || null
    const allProducts = getAllProductsSorted()
    const catData = getCategoriesOrdered()

    // Build ordered category list
    const catOrder = catData.map(c => c.category)
    // Fill any category not yet in the order table
    allProducts.forEach(p => { if (p.category && !catOrder.includes(p.category)) catOrder.push(p.category) })

    const products = activeCategory
      ? allProducts.filter(p => p.category === activeCategory)
      : allProducts

    // Categories for sidebar filter, in sorted order
    const categories = catOrder
      .filter(c => allProducts.some(p => p.category === c))
      .map(c => ({ category: c }))

    const siteUrl = process.env.SITE_URL || 'http://168.144.189.151'
    return {
      props: {
        products: products.map(p => ({ ...p })),
        categories,
        activeCategory,
        siteUrl,
      },
    }
  } catch {
    return { props: { products: [], categories: [], activeCategory: null, siteUrl: '' } }
  }
}
