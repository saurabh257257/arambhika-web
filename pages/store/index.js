import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
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

/* ── Search suggestion dropdown ── */
function SearchBox({ products, search, setSearch }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  const suggestions = search.trim().length > 0
    ? products.filter(p => {
        const q = search.toLowerCase()
        return p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
      }).slice(0, 8)
    : []

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function pick(p) {
    setSearch('')
    setOpen(false)
    router.push(`/store/${p.slug}`)
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') { setOpen(false); setSearch('') }
  }

  return (
    <div className="sc-search-wrap" ref={wrapRef}>
      <input
        className="sc-searchbar"
        type="text"
        placeholder="Search products by name, SKU or category..."
        value={search}
        onChange={e => { setSearch(e.target.value); setOpen(true) }}
        onFocus={() => search && setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="sc-suggest-drop">
          {suggestions.map(p => {
            const img = JSON.parse(p.images || '[]')[0]
            return (
              <div key={p.id} className="sc-suggest-item" onMouseDown={() => pick(p)}>
                <div className="sc-suggest-img">
                  {img ? <img src={img} alt={p.name} /> : <span>{(p.name || '?').slice(0,1)}</span>}
                </div>
                <div className="sc-suggest-info">
                  <span className="sc-suggest-name">{p.name}</span>
                  <span className="sc-suggest-meta">
                    {p.sku && <b>{p.sku}</b>}
                    {p.sku && p.category && ' · '}
                    {p.category}
                    {p.price && ` · ₹${p.price}/${p.unit || 'unit'}`}
                  </span>
                </div>
              </div>
            )
          })}
          <div className="sc-suggest-footer">
            Press Enter to search all · Esc to close
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main store page ── */
export default function Store({ products, categories, activeCategory, settings }) {
  const WA = settings.wa_number || '919315545821'
  const [search, setSearch]       = useState('')
  const [quote, setQuote]         = useState([])
  const [showQuote, setShowQuote] = useState(false)
  const catbarRef                 = useRef(null)

  useEffect(() => { setQuote(loadQuote()) }, [])
  useEffect(() => { saveQuote(quote) }, [quote])

  // Intercept horizontal touch on catbar so page doesn't scroll instead
  useEffect(() => {
    const el = catbarRef.current
    if (!el) return
    let startX = 0, startY = 0
    const onStart = (e) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }
    const onMove = (e) => {
      const dx = Math.abs(e.touches[0].clientX - startX)
      const dy = Math.abs(e.touches[0].clientY - startY)
      if (dx > dy && dx > 5) {
        e.preventDefault()
        el.scrollLeft += startX - e.touches[0].clientX
        startX = e.touches[0].clientX
      }
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
    }
  }, [])

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

  const scrollCat = (dir) => {
    if (catbarRef.current) catbarRef.current.scrollBy({ left: dir * 240, behavior: 'smooth' })
  }

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return !q || p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
  })

  return (
    <Layout title="Product Store" settings={settings}
      description="Browse our full catalog of nickel strips, copper busbars, and battery connectors.">

      {/* Sticky search bar with suggestion dropdown */}
      <div className="sc-searchbar-sticky">
        <SearchBox products={products} search={search} setSearch={setSearch} />
      </div>

      <div className="sc-layout2">
        <main className="sc-main2">
          {/* Sticky category strip inside product column */}
          <div className="sc-catbar-wrap">
            <button className="sc-catbar-arrow" onClick={() => scrollCat(-1)}>&#8249;</button>
            <div className="sc-catbar2" ref={catbarRef}>
              <Link href="/store" className={`sc-catcard${!activeCategory ? ' active' : ''}`}>
                <div className="sc-catcard-img sc-catcard-all">All</div>
                <span className="sc-catcard-label">All</span>
              </Link>
              {categories.map(c => (
                <Link key={c.category} href={`/store?category=${encodeURIComponent(c.category)}`}
                  className={`sc-catcard${activeCategory === c.category ? ' active' : ''}`}>
                  <div className="sc-catcard-img">
                    {c.image
                      ? <img src={c.image} alt={c.category} />
                      : <span>{c.category.slice(0,2).toUpperCase()}</span>}
                  </div>
                  <span className="sc-catcard-label">{c.category}</span>
                </Link>
              ))}
            </div>
            <button className="sc-catbar-arrow" onClick={() => scrollCat(1)}>&#8250;</button>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>{search ? 'Try a different search term.' : <>Add products from the <Link href="/admin/products">admin panel</Link>.</>}</p>
            </div>
          ) : (
            <div className="sc-product-list">
              {filtered.map(p => (
                <ProductCard key={p.id} p={p} quote={quote} onQtyChange={upsertQuote} />
              ))}
            </div>
          )}
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
