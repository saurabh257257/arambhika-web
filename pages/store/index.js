import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'

export function loadQuote() {
  try { return JSON.parse(localStorage.getItem('arambhika_quote') || '[]') } catch { return [] }
}
export function saveQuote(q) {
  try { localStorage.setItem('arambhika_quote', JSON.stringify(q)) } catch {}
}

/* ── Image Lightbox ── */
function Lightbox({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx)
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length); if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + images.length) % images.length) }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [images.length, onClose])
  return (
    <div className="lb-backdrop" onClick={onClose}>
      <button className="lb-close" onClick={onClose}>✕</button>
      <button className="lb-arrow lb-arrow-l" onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length) }}>&#8249;</button>
      <div className="lb-img-wrap" onClick={e => e.stopPropagation()}>
        <img src={images[idx]} alt="" className="lb-img" />
      </div>
      <button className="lb-arrow lb-arrow-r" onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length) }}>&#8250;</button>
      {images.length > 1 && (
        <div className="lb-dots">
          {images.map((_, i) => <span key={i} className={`lb-dot${i === idx ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setIdx(i) }} />)}
        </div>
      )}
    </div>
  )
}

/* ── Product card — horizontal on desktop, vertical on mobile ── */
function ProductCard({ p, quote, onQtyChange }) {
  const images  = JSON.parse(p.images || '[]')
  const minQty  = Number(p.min_qty) || 1
  const inQuote = quote.find(x => x.id === p.id)
  const [imgIdx, setImgIdx] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const qty = inQuote ? inQuote.qty : minQty

  const changeQty = (delta) => {
    const next = Math.max(minQty, qty + delta)
    onQtyChange(p, next)
  }

  const available = p.availability !== 'out of stock'

  return (
    <article className="pcard">
      {/* Image */}
      {lightbox && <Lightbox images={images} startIdx={imgIdx} onClose={() => setLightbox(false)} />}
      <div className="pcard-img-wrap" onClick={() => images.length > 0 && setLightbox(true)} style={{ cursor: images.length > 0 ? 'zoom-in' : 'default' }}>
        {images.length > 0 ? (
          <>
            <img src={images[imgIdx]} alt={p.name} className="pcard-img" loading="lazy" />
            {images.length > 1 && (
              <>
                <button className="pcard-arrow pcard-arrow-l" onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + images.length) % images.length) }}>‹</button>
                <button className="pcard-arrow pcard-arrow-r" onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % images.length) }}>›</button>
                <div className="pcard-dots">
                  {images.map((_, i) => (
                    <span key={i} className={`pcard-dot${i === imgIdx ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setImgIdx(i) }} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="pcard-img-empty">No image</div>
        )}
      </div>

      {/* Content */}
      <div className="pcard-body">
        <div className="pcard-header">
          <div>
            <p className="pcard-category">{p.category}</p>
            <Link href={`/store/${p.slug}`} className="pcard-name-link">
              <h2 className="pcard-name">{p.name}{p.sku && <span className="pcard-sku"> · {p.sku}</span>}</h2>
            </Link>
          </div>
          <span className={`pcard-badge ${available ? 'pcard-badge-in' : 'pcard-badge-out'}`}>
            {available ? 'Available' : 'Out of Stock'}
          </span>
        </div>

        <div className="pcard-meta">
          {p.price && <span className="pcard-price">₹{p.price}<span className="pcard-unit">/{p.unit || 'unit'}</span></span>}
          {p.min_qty && <span className="pcard-minqty">Min Qty: <strong>{p.min_qty} {p.unit || ''}</strong></span>}
        </div>

        {p.description && (
          <>
            <p className={`pcard-desc${expanded ? ' pcard-desc-open' : ''}`}>{p.description}</p>
            <button className="pcard-toggle" onClick={() => setExpanded(v => !v)}>
              {expanded ? '− Less' : '+ More details'}
            </button>
          </>
        )}

        <div className="pcard-actions">
          <div className="pcard-qty">
            <button onClick={() => changeQty(-1)}>−</button>
            <span>{qty} {p.unit || 'unit'}</span>
            <button onClick={() => changeQty(+1)}>+</button>
          </div>
          <button
            className={`pcard-add-btn${inQuote ? ' pcard-add-btn-in' : ''}`}
            onClick={() => onQtyChange(p, qty)}
          >
            {inQuote ? '✓ In Quote' : 'Add to Quote'}
          </button>
        </div>
      </div>
    </article>
  )
}

/* ── Quote panel ── */
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
    <div className="qp-inner">
      <div className="qp-head">
        <span className="qp-title">Quote ({quote.length})</span>
        <button className="qp-clear" onClick={onClear}>Clear</button>
      </div>

      {quote.length === 0 ? (
        <p className="qp-empty">No items yet. Add products to build your quote.</p>
      ) : (
        <ul className="qp-list">
          {quote.map(item => (
            <li key={item.id} className="qp-item">
              <div className="qp-item-info">
                <strong>{item.name}</strong>
                {item.sku && <span className="qp-sku"> ({item.sku})</span>}
                <div className="qp-item-qty">
                  <button className="qp-qty-btn" onClick={() => onQtyChange(item, Math.max(Number(item.min_qty)||1, item.qty - 1))}>−</button>
                  <span>{item.qty} {item.unit || ''}</span>
                  <button className="qp-qty-btn" onClick={() => onQtyChange(item, item.qty + 1)}>+</button>
                </div>
              </div>
              <button className="qp-remove" onClick={() => onRemove(item.id)}>✕</button>
            </li>
          ))}
        </ul>
      )}

      <div className="qp-phone">
        <label className="qp-phone-label">Your Mobile Number</label>
        <div className="qp-phone-cc">🇮🇳 +91</div>
        <input className="qp-phone-input" type="tel" placeholder="Enter mobile number"
          value={mobile} onChange={e => setMobile(e.target.value)} />
      </div>
      <button className="qp-proceed" onClick={proceed}>Proceed on WhatsApp</button>
      <p className="qp-hint">We'll send your quote details on WhatsApp.</p>
    </div>
  )
}

/* ── Search box ── */
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

  function pick(p) { setSearch(''); setOpen(false); router.push(`/store/${p.slug}`) }

  return (
    <div className="sc-search-wrap" ref={wrapRef}>
      <input
        className="sc-searchbar"
        type="text"
        placeholder="Search products by name, SKU or category..."
        value={search}
        onChange={e => { setSearch(e.target.value); setOpen(true) }}
        onFocus={() => search && setOpen(true)}
        onKeyDown={e => e.key === 'Escape' && (setOpen(false), setSearch(''))}
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
          <div className="sc-suggest-footer">Esc to close</div>
        </div>
      )}
    </div>
  )
}

/* ── Category sidebar (desktop) ── */
function CategorySidebar({ categories, activeCategory }) {
  return (
    <aside className="cat-sidebar">
      <h3 className="cat-sidebar-title">Categories</h3>
      <ul className="cat-sidebar-list">
        <li>
          <Link href="/store" className={`cat-sidebar-item${!activeCategory ? ' active' : ''}`}>
            <span className="cat-sidebar-all">All</span>
            <span className="cat-sidebar-name">All Products</span>
          </Link>
        </li>
        {categories.map(c => (
          <li key={c.category}>
            <Link href={`/store?category=${encodeURIComponent(c.category)}`}
              className={`cat-sidebar-item${activeCategory === c.category ? ' active' : ''}`}>
              {c.image
                ? <img src={c.image} alt={c.category} className="cat-sidebar-img" />
                : <span className="cat-sidebar-placeholder">{c.category.slice(0,2).toUpperCase()}</span>
              }
              <span className="cat-sidebar-name">{c.category}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}

/* ── Mobile category strip ── */
function MobileCatStrip({ categories, activeCategory }) {
  return (
    <div className="mob-catstrip">
      <Link href="/store" className={`mob-catpill${!activeCategory ? ' active' : ''}`}>
        <span className="mob-catpill-icon mob-catpill-all">All</span>
        <span className="mob-catpill-label">All</span>
      </Link>
      {categories.map(c => (
        <Link key={c.category} href={`/store?category=${encodeURIComponent(c.category)}`}
          className={`mob-catpill${activeCategory === c.category ? ' active' : ''}`}>
          {c.image
            ? <img src={c.image} alt={c.category} className="mob-catpill-img" />
            : <span className="mob-catpill-icon">{c.category.slice(0,2).toUpperCase()}</span>
          }
          <span className="mob-catpill-label">{c.category}</span>
        </Link>
      ))}
    </div>
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
        const next = [...prev]; next[idx] = { ...next[idx], qty }; return next
      }
      return [...prev, { ...product, qty }]
    })
  }, [])

  const removeFromQuote = useCallback((id) => setQuote(prev => prev.filter(x => x.id !== id)), [])

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return !q || p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
  })

  return (
    <Layout title="Product Store" settings={settings}
      description="Browse our full catalog of nickel strips, copper busbars, and battery connectors.">

      {/* Sticky search */}
      <div className="sc-searchbar-sticky">
        <SearchBox products={products} search={search} setSearch={setSearch} />
      </div>

      {/* Mobile category strip */}
      <div className="mob-catstrip-wrap">
        <MobileCatStrip categories={categories} activeCategory={activeCategory} />
      </div>

      {/* 3-column layout */}
      <div className="store-layout">
        <CategorySidebar categories={categories} activeCategory={activeCategory} />

        <main className="store-main">
          {activeCategory && (
            <div className="store-cat-header">
              <h1 className="store-cat-title">{activeCategory}</h1>
              <Link href="/store" className="store-cat-clear">✕ Clear filter</Link>
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>{search ? 'Try a different search term.' : <>Add products from the <Link href="/admin/products">admin panel</Link>.</>}</p>
            </div>
          ) : (
            <div className="pcard-list">
              {filtered.map(p => (
                <ProductCard key={p.id} p={p} quote={quote} onQtyChange={upsertQuote} />
              ))}
            </div>
          )}
        </main>

        <aside className="store-quote-col">
          <QuotePanel quote={quote} WA={WA}
            onRemove={removeFromQuote}
            onQtyChange={(item, qty) => upsertQuote(item, qty)}
            onClear={() => setQuote([])} />
        </aside>
      </div>

      {/* Mobile floating quote button */}
      <button className="sc-float-btn" onClick={() => setShowQuote(v => !v)}>
        View Quote ({quote.length})
      </button>

      {showQuote && (
        <div className="mobile-quote-drawer">
          <QuotePanel quote={quote} WA={WA}
            onRemove={removeFromQuote}
            onQtyChange={(item, qty) => upsertQuote(item, qty)}
            onClear={() => setQuote([])} />
          <button className="qp-clear" style={{ marginTop: '0.75rem', width: '100%' }}
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

    const products    = activeCategory ? allProducts.filter(p => p.category === activeCategory) : allProducts
    const catImageMap = Object.fromEntries(catData.map(c => [c.category, c.image || null]))
    const categories  = catOrder
      .filter(c => allProducts.some(p => p.category === c))
      .map(c => ({ category: c, image: catImageMap[c] || null }))

    return { props: { products: products.map(p => ({ ...p })), categories, activeCategory, settings } }
  } catch {
    return { props: { products: [], categories: [], activeCategory: null, settings: {} } }
  }
}
