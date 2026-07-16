import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'

export default function ProductPage({ product, siteUrl, settings = {} }) {
  const WA = settings.wa_number || '919315545821'
  const router = useRouter()
  const [imgIdx, setImgIdx] = useState(0)
  const [copied, setCopied] = useState(false)
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

  if (!product) return null

  const images = JSON.parse(product.images || '[]')
  const specs = JSON.parse(product.specs || '[]')
  const pageUrl = `${siteUrl}/store/${product.slug}`
  const minQty = Number(product.min_qty) || 1

  const metaDesc = product.description
    ? `${product.description} | Price: ₹${product.price}/${product.unit} | Min Qty: ${product.min_qty} ${product.unit}`
    : `${product.name} — ₹${product.price}/${product.unit}. Buy from Arambhika Enablers.`

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: product.name, description: product.description || '', sku: product.sku || '',
    image: images, url: pageUrl,
    brand: { '@type': 'Brand', name: 'Arambhika Enablers' },
    offers: { '@type': 'Offer', priceCurrency: 'INR', price: product.price || '0', availability: 'https://schema.org/InStock' },
  }

  function copyUrl() {
    navigator.clipboard.writeText(pageUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const inQuote = quote.find(x => x.id === product.id)
  const currentQty = inQuote ? inQuote.qty : minQty

  function upsertQuote(qty) {
    setQuote(prev => {
      const idx = prev.findIndex(x => x.id === product.id)
      if (idx >= 0) {
        const next = [...prev]; next[idx] = { ...next[idx], qty }; return next
      }
      return [...prev, { ...product, qty }]
    })
  }

  function changeQty(delta) {
    const next = Math.max(minQty, currentQty + delta)
    upsertQuote(next)
  }

  function removeFromQuote(id) {
    setQuote(prev => prev.filter(x => x.id !== id))
  }

  function updateItemQty(item, qty) {
    setQuote(prev => prev.map(x => x.id === item.id ? { ...x, qty } : x))
  }

  function proceedWhatsApp() {
    if (!mobile) { alert('Please enter your mobile number'); return }
    if (quote.length === 0) { alert('Add at least one product to your quote'); return }
    const lines = quote.map(q => `• ${q.name}${q.sku ? ` (${q.sku})` : ''} — Qty: ${q.qty} ${q.unit || ''}`)
    const msg = `Hi, I'd like a quote:\n\n${lines.join('\n')}\n\nMy number: +91${mobile}`
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const waMsg = encodeURIComponent(`Hi, I want to order:\n• ${product.name}${product.sku ? ` (${product.sku})` : ''}\n\nProduct page: ${pageUrl}`)

  return (
    <Layout title={product.name} description={metaDesc} ogImage={images[0] || null} ogUrl={pageUrl} settings={settings}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb / back */}
      <div className="pd-topbar">
        <div className="container">
          <button className="pd-back-btn" onClick={() => router.back()}>← Back to Store</button>
          <div className="pd-breadcrumb">
            <Link href="/">Home</Link><span>/</span>
            <Link href="/store">Store</Link><span>/</span>
            <Link href={`/store?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
            <span>/</span><span>{product.name}</span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="pd-page-layout">
        {/* Product content */}
        <div className="pd-page-content container">
          <div className="pd-layout">
            {/* Images */}
            <div className="pd-img-col">
              <div className="pd-carousel">
                {images.length > 0 ? (
                  <>
                    <img src={images[imgIdx]} alt={`${product.name} - image ${imgIdx + 1}`} className="pd-img-main" />
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
                  <div className="pd-img-empty">No image uploaded</div>
                )}
              </div>
              {images.length > 1 && (
                <div className="pd-thumbs">
                  {images.map((img, i) => (
                    <img key={i} src={img} alt={`${product.name} ${i + 1}`}
                      className={`pd-thumb${i === imgIdx ? ' active' : ''}`}
                      onClick={() => setImgIdx(i)} />
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="pd-info-col">
              <div className="pd-top">
                <div>
                  <p className="pd-category">{product.category}</p>
                  <h1 className="pd-name">
                    {product.name}
                    {product.sku && <span className="pd-sku"> ({product.sku})</span>}
                  </h1>
                  {product.description && <p className="pd-desc">{product.description}</p>}
                </div>
                <span className="sc-avail">Available</span>
              </div>

              <div className="pd-price-row">
                {product.price && <span className="pd-price">Price: ₹{product.price}/{product.unit || 'unit'}</span>}
                {product.min_qty && <span className="pd-minqty">Min Qty: {product.min_qty} {product.unit || ''}</span>}
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

              <div className="pd-cta-row">
                <div className="sc-qty">
                  <button onClick={() => changeQty(-1)}>−</button>
                  <span>{currentQty} {product.unit || 'unit'}</span>
                  <button onClick={() => changeQty(+1)}>+</button>
                </div>
                <button
                  className="sc-add-btn"
                  style={inQuote ? { background: '#16a34a' } : {}}
                  onClick={() => upsertQuote(currentQty)}>
                  {inQuote ? '✓ In Quote' : 'Add to Quote'}
                </button>
                <a href={`https://wa.me/${WA}?text=${waMsg}`} className="pd-wa-btn" target="_blank" rel="noopener noreferrer">
                  Order on WhatsApp
                </a>
              </div>

              {/* Shareable link — product URL only */}
              <div className="pd-links-box">
                <p className="pd-links-title">Share this product</p>
                <div className="pd-link-val">
                  <span>{pageUrl}</span>
                  <button className="pd-copy-btn" onClick={copyUrl}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quote panel */}
        <aside className="pd-quote-panel">
          <div className="sc-quote-header">
            <span className="sc-quote-title">View Quote</span>
            <button className="sc-quote-clear" onClick={() => setQuote([])}>Clear</button>
          </div>
          {quote.length === 0 ? (
            <p className="sc-quote-empty">No items added yet. Use +/− to add.</p>
          ) : (
            <ul className="sc-quote-list">
              {quote.map(item => (
                <li key={item.id} className="sc-quote-item">
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.82rem' }}>{item.name}</strong>
                    {item.sku && <span className="sc-quote-sku"> ({item.sku})</span>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <button className="sc-mini-qty-btn" onClick={() => updateItemQty(item, Math.max(Number(item.min_qty)||1, item.qty - 1))}>−</button>
                      <span className="sc-quote-qty">{item.qty} {item.unit || ''}</span>
                      <button className="sc-mini-qty-btn" onClick={() => updateItemQty(item, item.qty + 1)}>+</button>
                    </div>
                  </div>
                  <button className="sc-quote-remove" onClick={() => removeFromQuote(item.id)}>✕</button>
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

      {/* Mobile floating quote button */}
      <button className="sc-float-btn" onClick={() => setShowQuote(v => !v)}>
        View Quote ({quote.length})
      </button>

      {/* Mobile quote drawer */}
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
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.82rem' }}>{item.name}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <button className="sc-mini-qty-btn" onClick={() => updateItemQty(item, Math.max(Number(item.min_qty)||1, item.qty - 1))}>−</button>
                      <span className="sc-quote-qty">{item.qty} {item.unit || ''}</span>
                      <button className="sc-mini-qty-btn" onClick={() => updateItemQty(item, item.qty + 1)}>+</button>
                    </div>
                  </div>
                  <button className="sc-quote-remove" onClick={() => removeFromQuote(item.id)}>✕</button>
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

export async function getServerSideProps({ params }) {
  try {
    const { getProductBySlug, getSettings } = require('../../lib/db')
    const product = getProductBySlug(params.slug)
    if (!product) return { notFound: true }
    const settings = getSettings()
    const siteUrl = process.env.SITE_URL || 'http://168.144.189.151'
    return { props: { product: { ...product }, siteUrl, settings } }
  } catch {
    return { notFound: true }
  }
}
