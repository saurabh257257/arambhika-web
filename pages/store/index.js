import { useState, useCallback } from 'react'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { getAllProducts, getCategories } from '../../lib/db'

const WA = '919315545821'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || ''

/* ── Product modal (drawer) ── */
function ProductModal({ p, siteUrl, onClose, onAddToQuote }) {
  const images = JSON.parse(p.images || '[]')
  const specs = JSON.parse(p.specs || '[]')
  const [imgIdx, setImgIdx] = useState(0)
  const [qty, setQty] = useState(Number(p.min_qty) || 1)
  const [copied, setCopied] = useState(null)
  const minQty = Number(p.min_qty) || 1
  const pageUrl = `${siteUrl}/store/${p.slug}`
  const absImages = images.map(img => img.startsWith('http') ? img : `${siteUrl}${img}`)

  const waMsg = encodeURIComponent(
    `Hi, I want to order:\n• ${p.name}${p.sku ? ` (${p.sku})` : ''}\n  Qty: ${qty} ${p.unit || ''}\n\nProduct page: ${pageUrl}`
  )

  function copy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  // Close on Escape key
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-drawer">
        <div className="modal-header">
          <div className="modal-breadcrumb">
            <span>{p.category}</span>
            <span> / </span>
            <span>{p.name}</span>
          </div>
          <div className="modal-header-actions">
            <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="modal-open-link" title="Open full page">
              ↗ Open page
            </a>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="modal-body">
          {/* Left: carousel */}
          <div className="modal-img-col">
            <div className="pd-carousel">
              {images.length > 0 ? (
                <>
                  <img src={images[imgIdx]} alt={`${p.name} - image ${imgIdx + 1}`} className="modal-img-main" />
                  {images.length > 1 && (
                    <>
                      <button className="sc-arrow sc-arrow-l" onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}>&#8249;</button>
                      <button className="sc-arrow sc-arrow-r" onClick={() => setImgIdx(i => (i + 1) % images.length)}>&#8250;</button>
                      <div className="sc-dots">
                        {images.map((_, i) => (
                          <span key={i} className={`sc-dot${i === imgIdx ? ' active' : ''}`} onClick={() => setImgIdx(i)} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="pd-img-empty">No image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="pd-thumbs">
                {images.map((img, i) => (
                  <img key={i} src={img} alt={`${p.name} ${i + 1}`}
                    className={`pd-thumb${i === imgIdx ? ' active' : ''}`}
                    onClick={() => setImgIdx(i)} />
                ))}
              </div>
            )}
          </div>

          {/* Right: info */}
          <div className="modal-info-col">
            <div className="modal-top">
              <div>
                <h2 className="modal-name">
                  {p.name}
                  {p.sku && <span className="pd-sku"> ({p.sku})</span>}
                </h2>
                {p.description && <p className="pd-desc">{p.description}</p>}
              </div>
              <span className="sc-avail">Available</span>
            </div>

            <div className="pd-price-row">
              {p.price && <span className="pd-price">Price: ₹{p.price}/{p.unit || 'unit'}</span>}
              {p.min_qty && <span className="pd-minqty">Min Qty: {p.min_qty} {p.unit || ''}</span>}
            </div>

            {specs.length > 0 && (
              <div className="pd-specs">
                <p className="pd-specs-title">Specifications</p>
                <table className="specs-table">
                  <tbody>
                    {specs.map((s, i) => <tr key={i}><td>{s.key}</td><td>{s.value}</td></tr>)}
                  </tbody>
                </table>
              </div>
            )}

            {/* Qty + actions */}
            <div className="modal-actions">
              <div className="sc-qty">
                <button onClick={() => setQty(q => Math.max(minQty, q - 1))}>−</button>
                <span>{qty} {p.unit || 'unit'}</span>
                <button onClick={() => setQty(q => q + 1)}>+</button>
              </div>
              <button className="sc-add-btn" onClick={() => { onAddToQuote({ ...p, qty }); onClose() }}>
                Add to Quote
              </button>
              <a href={`https://wa.me/${WA}?text=${waMsg}`}
                className="pd-wa-btn" target="_blank" rel="noopener noreferrer">
                Order on WhatsApp
              </a>
            </div>

            {/* Shareable links */}
            <div className="pd-links-box">
              <p className="pd-links-title">Shareable Links</p>
              <div className="pd-link-row">
                <span className="pd-link-label">Product page</span>
                <div className="pd-link-val">
                  <span>{pageUrl}</span>
                  <button className="pd-copy-btn" onClick={() => copy(pageUrl, 'page')}>
                    {copied === 'page' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              {absImages.map((url, i) => (
                <div key={i} className="pd-link-row">
                  <span className="pd-link-label">Image {i + 1}</span>
                  <div className="pd-link-val">
                    <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                    <button className="pd-copy-btn" onClick={() => copy(url, `img-${i}`)}>
                      {copied === `img-${i}` ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Product card ── */
function ProductCard({ p, onAddToQuote, onOpen }) {
  const images = JSON.parse(p.images || '[]')
  const [imgIdx, setImgIdx] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [qty, setQty] = useState(Number(p.min_qty) || 1)
  const minQty = Number(p.min_qty) || 1

  return (
    <article className="sc-card">
      {/* Clickable image opens modal */}
      <div className="sc-img-wrap" onClick={onOpen} style={{ cursor: 'pointer' }}>
        {images.length > 0 ? (
          <>
            <img src={images[imgIdx]} alt={p.name} className="sc-img" loading="lazy" />
            {images.length > 1 && (
              <>
                <button className="sc-arrow sc-arrow-l" onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + images.length) % images.length) }}>&#8249;</button>
                <button className="sc-arrow sc-arrow-r" onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % images.length) }}>&#8250;</button>
                <div className="sc-dots">
                  {images.map((_, i) => (
                    <span key={i} className={`sc-dot${i === imgIdx ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setImgIdx(i) }} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="sc-img-empty">No image</div>
        )}
      </div>

      <div className="sc-body">
        <div className="sc-top-row">
          <div className="sc-info">
            {/* Product name → opens modal */}
            <h2 className="sc-name" onClick={onOpen} style={{ cursor: 'pointer' }}>
              {p.name}
              {p.sku && <span className="sc-sku"> ({p.sku})</span>}
            </h2>
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
export default function Store({ products, categories, activeCategory, siteUrl }) {
  const [search, setSearch] = useState('')
  const [quote, setQuote] = useState([])
  const [mobile, setMobile] = useState('')
  const [activeProduct, setActiveProduct] = useState(null)

  function openProduct(p) {
    setActiveProduct(p)
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/store/${p.slug}`)
    }
  }

  const closeProduct = useCallback(() => {
    setActiveProduct(null)
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/store')
    }
  }, [])

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
            <ProductCard key={p.id} p={p} onAddToQuote={addToQuote} onOpen={() => openProduct(p)} />
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

      <button className="sc-float-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        View Quote ({quote.length})
      </button>

      {/* Product modal */}
      {activeProduct && (
        <ProductModal
          p={activeProduct}
          siteUrl={siteUrl}
          onClose={closeProduct}
          onAddToQuote={addToQuote}
        />
      )}
    </Layout>
  )
}

export async function getServerSideProps({ query }) {
  try {
    const category = query.category || null
    const products = getAllProducts(category)
    const categories = getCategories()
    const siteUrl = process.env.SITE_URL || 'http://168.144.189.151'
    return {
      props: {
        products: products.map(p => ({ ...p })),
        categories,
        activeCategory: category,
        siteUrl,
      },
    }
  } catch {
    return { props: { products: [], categories: [], activeCategory: null, siteUrl: '' } }
  }
}
