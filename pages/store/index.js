import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Layout from '../../components/Layout'

/* ── Shared quote helpers (localStorage) ── */
export function loadQuote() {
  try { return JSON.parse(localStorage.getItem('arambhika_quote') || '[]') } catch { return [] }
}
export function saveQuote(q) {
  try { localStorage.setItem('arambhika_quote', JSON.stringify(q)) } catch {}
}

/* ── Product card ── */
function ProductCard({ p, quote, onQtyChange }) {
  const images  = JSON.parse(p.images || '[]')
  const minQty  = Number(p.min_qty) || 1
  const inQuote = quote.find(x => x.id === p.id)
  const [imgIdx, setImgIdx] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const qty = inQuote ? inQuote.qty : minQty

  const changeQty = (delta) => {
    const next = Math.max(minQty, qty + delta)
    onQtyChange(p, next)
  }

  return (
    <article className="sc-card">
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
          <span className="sc-avail">{p.availability === 'out of stock' ? 'Out of Stock' : 'Available'}</span>
        </div>

        <button className="sc-expand" onClick={() => setExpanded(v => !v)}>
          <span className="sc-expand-icon">{expanded ? '−' : '+'}</span>
          More details
        </button>
        {expanded && p.description && <p className="sc-desc">{p.description}</p>}

        <div className="sc-actions">
          <div className="sc-qty">
            <button onClick={() => changeQty(-1)}>−</button>
            <span>{qty} {p.unit || 'unit'}</span>
            <button onClick={() => changeQty(+1)}>+</button>
          </div>
          <button
            className="sc-add-btn"
            style={inQuote ? { background: '#16a34a' } : {}}
            onClick={() => onQtyChange(p, qty)}
          >
            {inQuote ? '✓ In Quote' : 'Add to Quote'}
          </button>
        </div>
      </div>
    </article>
  )
}

/* ── Quote panel (reusable) ── */
function QuotePanel({ quote, onRemove, onQtyChange, onClear, WA }) {
  const [mobile, setMobile] = useState('')

  function proceed() {
    if (!mobile) { alert('Please enter your mobile number'); return }
    if (quote.length === 0) { alert('Add at least one product to your quote'); return }
    const lines = quote.map(q => `• ${q.name}${q.sku ? ` (${q.sku})` : ''} — Qty: ${q.qty} ${q.unit || ''}`)
    const msg = `Hi, I'd like a quote:\n\n${lines.join('\n')}\n\nMy number: +91${mobile}`
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <>
      <div className="sc-quote-header">
        <span className="sc-quote-title">View Quote ({quote.length})</span>
        <button className="sc-quote-clear" onClick={onClear}>Clear</button>
      </div>
      {quote.length === 0 ? (
        <p className="sc-quote-empty">No items yet. Click "Add to Quote" or use +/− to add.</p>
      ) : (
        <ul className="sc-quote-list">
          {quote.map(item => (
            <li key={item.id} className="sc-quote-item">
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '0.82rem' }}>{item.name}</strong>
                {item.sku && <span className="sc-quote-sku"> ({item.sku})</span>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <button className="sc-mini-qty-btn" onClick={() => onQtyChange(item, Math.max(Number(item.min_qty)||1, item.qty - 1))}>−</button>
                  <span className="sc-quote-qty">{item.qty} {item.unit || ''}</span>
                  <button className="sc-mini-qty-btn" onClick={() => onQtyChange(item, item.qty + 1)}>+</button>
                </div>
              </div>
              <button className="sc-quote-remove" onClick={() => onRemove(item.id)}>✕</button>
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
      <button className="sc-proceed-btn" onClick={proceed}>Proceed on WhatsApp</button>
      <p className="sc-proceed-hint">Opens WhatsApp with your quote details.</p>
    </>
  )
}

/* ── Main store page ── */
export default function Store({ products, categories, activeCategory, settings }) {
  const WA = settings.wa_number || '919315545821'
  const [search, setSearch]       = useState('')
  const [quote, setQuote]         = useState([])
  const [showQuote, setShowQuote] = useState(false)

  useEffect(() => { setQuote(loadQuote()) }, [])
  useEffect(() => { saveQuote(quote) }, [quote])

  const upsertQuote = useCallback((product, qty) => {
    setQuote(prev => {
      const idx = prev.findIndex(x => x.id === product.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty }
        return next
      }
      return [...prev, { ...product, qty }]
    })
  }, [])

  const removeFromQuote = useCallback((id) => {
    setQuote(prev => prev.filter(x => x.id !== id))
  }, [])

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return !q || p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
  })

  return (
    <Layout title="Product Store" settings={settings}
      description="Browse our full catalog of nickel strips, copper busbars, and battery connectors.">
      <div className="sc-searchbar-wrap">
        <input className="sc-searchbar" type="text" placeholder="Search products..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="sc-layout">
        <aside className="sc-sidebar">
          <h3 className="sc-sidebar-title">Categories</h3>
          <Link href="/store" className={`sc-cat-item${!activeCategory ? ' active' : ''}`}>
            All Products
          </Link>
          {categories.map(c => (
            <Link key={c.category} href={`/store?category=${encodeURIComponent(c.category)}`}
              className={`sc-cat-item${activeCategory === c.category ? ' active' : ''}`}>
              {c.image && <img src={c.image} alt="" className="sc-cat-thumb" />}
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
            <ProductCard key={p.id} p={p} quote={quote} onQtyChange={upsertQuote} />
          ))}
        </main>

        <aside className="sc-quote-panel">
          <QuotePanel quote={quote} WA={WA}
            onRemove={removeFromQuote}
            onQtyChange={(item, qty) => upsertQuote(item, qty)}
            onClear={() => setQuote([])} />
        </aside>
      </div>

      {/* Mobile floating button */}
      <button className="sc-float-btn" onClick={() => setShowQuote(v => !v)}>
        View Quote ({quote.length})
      </button>

      {showQuote && (
        <div className="mobile-quote-drawer">
          <QuotePanel quote={quote} WA={WA}
            onRemove={removeFromQuote}
            onQtyChange={(item, qty) => upsertQuote(item, qty)}
            onClear={() => setQuote([])} />
          <button className="sc-quote-clear" style={{ marginTop: '0.75rem', width: '100%' }}
            onClick={() => setShowQuote(false)}>✕ Close</button>
        </div>
      )}
    </Layout>
  )
}

export async function getServerSideProps({ query }) {
  try {
    const { getAllProductsSorted, getCategoriesOrdered, getSettings } = require('../../lib/db')
    const activeCategory = query.category || null
    const allProducts    = getAllProductsSorted()
    const catData        = getCategoriesOrdered()
    const settings       = getSettings()

    const catOrder = catData.map(c => c.category)
    allProducts.forEach(p => { if (p.category && !catOrder.includes(p.category)) catOrder.push(p.category) })

    const products   = activeCategory ? allProducts.filter(p => p.category === activeCategory) : allProducts
    const catImageMap = Object.fromEntries(catData.map(c => [c.category, c.image || null]))
    const categories = catOrder
      .filter(c => allProducts.some(p => p.category === c))
      .map(c => ({ category: c, image: catImageMap[c] || null }))

    return {
      props: {
        products: products.map(p => ({ ...p })),
        categories,
        activeCategory,
        settings,
      },
    }
  } catch {
    return { props: { products: [], categories: [], activeCategory: null, settings: {} } }
  }
}
