import Link from 'next/link'
import Layout from '../../components/Layout'
import { getProductBySlug } from '../../lib/db'

const WA = '919315545821'

export default function ProductPage({ product, siteUrl }) {
  if (!product) return null

  const images = JSON.parse(product.images || '[]')
  const specs = JSON.parse(product.specs || '[]')
  const pageUrl = `${siteUrl}/store/${product.slug}`
  const absImages = images.map(img => img.startsWith('http') ? img : `${siteUrl}${img}`)

  const metaDesc = product.description
    ? `${product.description} | Price: ₹${product.price}/${product.unit} | Min Qty: ${product.min_qty} ${product.unit}`
    : `${product.name} — ₹${product.price}/${product.unit}. Min qty: ${product.min_qty} ${product.unit}. Buy from Arambhika Enablers.`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    sku: product.sku || '',
    image: absImages,
    url: pageUrl,
    brand: { '@type': 'Brand', name: 'Arambhika Enablers' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price || '0',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Arambhika Enablers' },
    },
  }

  return (
    <Layout
      title={product.name}
      description={metaDesc}
      ogImage={absImages[0] || null}
      ogUrl={pageUrl}
    >
      {/* JSON-LD for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link><span>/</span>
          <Link href="/store">Store</Link><span>/</span>
          <Link href={`/store?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
          <span>/</span><span>{product.name}</span>
        </div>

        <div className="pd-layout">
          {/* Images */}
          <div className="pd-img-col">
            <div className="pd-carousel">
              {images.length > 0 ? (
                <img src={images[0]} alt={product.name} className="pd-img-main" />
              ) : (
                <div className="pd-img-empty">No image uploaded</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="pd-thumbs">
                {images.map((img, i) => (
                  <img key={i} src={img} alt={`${product.name} ${i + 1}`} className="pd-thumb" />
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

            {/* WhatsApp order */}
            <div className="pd-order-row" style={{ marginTop: '1.25rem' }}>
              <a
                href={`https://wa.me/${WA}?text=${encodeURIComponent(`Hi, I want to order:\n• ${product.name}${product.sku ? ` (${product.sku})` : ''}\n\nProduct page: ${pageUrl}`)}`}
                className="pd-wa-btn" target="_blank" rel="noopener noreferrer"
              >
                Order on WhatsApp
              </a>
              <Link href="/store" className="btn btn-primary" style={{ fontSize: '0.88rem' }}>
                ← Back to Store
              </Link>
            </div>

            {/* Shareable links — key feature for WhatsApp/CRM/IndiaMART */}
            <div className="pd-links-box">
              <p className="pd-links-title">Shareable Links</p>
              <div className="pd-link-row">
                <span className="pd-link-label">Product page</span>
                <div className="pd-link-val">
                  <span>{pageUrl}</span>
                </div>
              </div>
              {absImages.map((url, i) => (
                <div key={i} className="pd-link-row">
                  <span className="pd-link-label">Image {i + 1}</span>
                  <div className="pd-link-val">
                    <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps({ params }) {
  try {
    const product = getProductBySlug(params.slug)
    if (!product) return { notFound: true }
    const siteUrl = process.env.SITE_URL || 'http://168.144.189.151'
    return { props: { product: { ...product }, siteUrl } }
  } catch {
    return { notFound: true }
  }
}
