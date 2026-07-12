import Link from 'next/link'
import Layout from '../../components/Layout'
import { getProductBySlug, getAllProductSlugs } from '../../lib/db'

export default function ProductPage({ product, siteUrl }) {
  if (!product) return null
  const images = JSON.parse(product.images || '[]')
  const specs = JSON.parse(product.specs || '[]')
  const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919315545821'
  const pageUrl = `${siteUrl}/store/${product.slug}`
  const waMsg = encodeURIComponent(
    `Hi, I'm interested in ${product.name}${product.sku ? ` (${product.sku})` : ''}.\nPage: ${pageUrl}\nPlease share pricing and availability.`
  )

  return (
    <Layout
      title={product.name}
      description={product.description || `${product.name} — ₹${product.price}/${product.unit}. Min qty: ${product.min_qty} ${product.unit}. ${product.category}.`}
      ogImage={images[0] || null}
      ogUrl={pageUrl}
    >
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link><span>/</span>
          <Link href="/store">Store</Link><span>/</span>
          <Link href={`/store?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
          <span>/</span><span>{product.name}</span>
        </div>

        <div className="product-detail">
          {/* Images */}
          <div className="product-images">
            {images.length > 0 ? (
              <>
                <img src={images[0]} alt={product.name} className="product-img-main" />
                {images.length > 1 && (
                  <div className="product-img-thumbs">
                    {images.map((img, i) => (
                      <img key={i} src={img} alt={`${product.name} ${i + 1}`} className="product-img-thumb" />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="product-card-img-placeholder" style={{ height: 340, borderRadius: 'var(--radius)' }}>
                No image uploaded
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-info">
            <p style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.4rem' }}>{product.category}</p>
            <h1>{product.name}</h1>
            {product.sku && <span className="product-sku-badge">SKU: {product.sku}</span>}

            <div className="product-price-row">
              {product.price && (
                <div>
                  <p className="product-price-label">Price</p>
                  <p className="product-price-value">₹{product.price}/{product.unit || 'unit'}</p>
                </div>
              )}
              {product.min_qty && (
                <div>
                  <p className="product-price-label">Min. Order</p>
                  <p className="product-minqty-value">{product.min_qty} {product.unit}</p>
                </div>
              )}
            </div>

            {product.description && <p className="product-desc">{product.description}</p>}

            {specs.length > 0 && (
              <>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Specifications</p>
                <table className="specs-table">
                  <tbody>
                    {specs.map((s, i) => (
                      <tr key={i}>
                        <td>{s.key}</td>
                        <td>{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div className="product-actions">
              <a href={`https://wa.me/${WA}?text=${waMsg}`}
                className="btn-wa-order" target="_blank" rel="noopener noreferrer">
                📲 Order on WhatsApp
              </a>
              <div className="share-link">
                <strong>Share this product:</strong> {pageUrl}
              </div>
              {images[0] && (
                <div className="share-link">
                  <strong>Product image link:</strong> <a href={images[0]} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{images[0]}</a>
                </div>
              )}
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
    return {
      props: {
        product: { ...product },
        siteUrl: process.env.SITE_URL || 'https://www.arambhikaenablers.in',
      },
    }
  } catch {
    return { notFound: true }
  }
}
