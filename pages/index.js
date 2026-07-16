import Link from 'next/link'
import Layout from '../components/Layout'
import { useState, useEffect, useRef } from 'react'

function HeroCarousel({ images }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (images.length < 2) return
    const t = setInterval(() => setIdx(i => (i + 1) % images.length), 4000)
    return () => clearInterval(t)
  }, [images.length])
  if (!images.length) return <div className="hero-carousel-empty" />
  return (
    <div className="hero-carousel">
      {images.map((src, i) => (
        <img key={i} src={src} alt="" className={i === idx ? 'active' : ''} />
      ))}
      {images.length > 1 && (
        <div className="carousel-dots">
          {images.map((_, i) => (
            <span key={i} className={`carousel-dot${i === idx ? ' active' : ''}`} onClick={() => setIdx(i)} />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryCarousel({ categories }) {
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null)

  const startTimer = (len) => {
    clearInterval(timerRef.current)
    if (len < 2) return
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % len), 3500)
  }

  useEffect(() => {
    startTimer(categories.length)
    return () => clearInterval(timerRef.current)
  }, [categories.length])

  const go = (dir) => {
    setIdx(i => (i + dir + categories.length) % categories.length)
    startTimer(categories.length)
  }

  if (!categories.length) return null
  return (
    <div className="cat-carousel-mob">
      <button className="cat-cmob-btn cat-cmob-btn-prev" onClick={() => go(-1)}>&#8249;</button>
      <div className="cat-cmob-slide">
        {categories.map((c, i) => (
          <Link key={c.category} href={`/store?category=${encodeURIComponent(c.category)}`}
            className={`cat-cmob-card${i === idx ? ' active' : ''}`}>
            <div className="cat-cmob-img-wrap">
              {c.image
                ? <img src={c.image} alt={c.category} className="cat-cmob-img" loading="lazy" />
                : <div className="cat-cmob-placeholder">{c.category.slice(0, 2).toUpperCase()}</div>
              }
            </div>
            <span className="cat-cmob-label">{c.category}</span>
          </Link>
        ))}
        {categories.length > 1 && (
          <div className="cat-cmob-dots">
            {categories.map((_, i) => (
              <button key={i}
                className={`cat-cmob-dot${i === idx ? ' active' : ''}`}
                onClick={e => { e.preventDefault(); setIdx(i); startTimer(categories.length) }} />
            ))}
          </div>
        )}
      </div>
      <button className="cat-cmob-btn cat-cmob-btn-next" onClick={() => go(1)}>&#8250;</button>
    </div>
  )
}

export default function Home({ featured, categories, settings, heroImages }) {
  const WA = settings.wa_number || '919315545821'

  return (
    <Layout settings={settings}>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>{settings.hero_title || 'Nickel Strips & Copper Busbars for Battery Manufacturers'}</h1>
          <p>{settings.hero_subtitle || 'Manufacturer and distributor based in Greater Noida. Serving EV, ESS, and battery pack makers across India.'}</p>
          <div className="hero-actions">
            <Link href="/store" className="btn btn-primary">{settings.hero_cta || 'Browse Products'}</Link>
            <a href={`https://wa.me/${WA}?text=Hi%2C%20I%20want%20to%20enquire%20about%20your%20products.`}
              className="btn btn-wa" target="_blank" rel="noopener noreferrer">
              WhatsApp Us
            </a>
          </div>
        </div>
        <HeroCarousel images={heroImages} />
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section" style={{ paddingBottom: '2rem' }}>
          <div className="container">
            <h2 className="section-title">Product Categories</h2>
            <p className="section-sub">Click a category to browse products</p>
            {/* Desktop: horizontal scroll row */}
            <div className="cat-card-row">
              {categories.map(c => (
                <Link key={c.category} href={`/store?category=${encodeURIComponent(c.category)}`} className="cat-card">
                  <div className="cat-card-img-wrap">
                    {c.image
                      ? <img src={c.image} alt={c.category} className="cat-card-img" loading="lazy" />
                      : <div className="cat-card-img-placeholder">{c.category.slice(0, 2).toUpperCase()}</div>
                    }
                  </div>
                  <span className="cat-card-label">{c.category}</span>
                </Link>
              ))}
            </div>
            {/* Mobile: auto-rotating carousel */}
            <CategoryCarousel categories={categories} />
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="section" style={{ background: 'var(--off)', padding: '3rem 0' }}>
          <div className="container">
            <div className="home-products-header">
              <h2 className="section-title" style={{ marginBottom: 0 }}>Featured Products</h2>
              <Link href="/store" className="home-view-all">View all →</Link>
            </div>
            <div className="home-product-grid">
              {featured.map(p => {
                const images = JSON.parse(p.images || '[]')
                return (
                  <Link key={p.id} href={`/store/${p.slug}`} className="home-product-tile">
                    <div className="home-product-img-wrap">
                      {images[0]
                        ? <img src={images[0]} alt={p.name} className="home-product-img" loading="lazy" />
                        : <div className="home-product-img-empty">{p.category?.slice(0,2).toUpperCase()}</div>
                      }
                    </div>
                    <p className="home-product-name">{p.name}</p>
                    {p.price && <p className="home-product-price">₹{p.price}/{p.unit || 'unit'}</p>}
                  </Link>
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
          <h2 className="section-title">{settings.cta_title || 'Need a custom quote?'}</h2>
          <p className="section-sub">{settings.cta_subtitle || "Send us your specifications on WhatsApp — we'll respond within 2 hours."}</p>
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
    const { getAllProductsSorted, getCategoriesOrdered, getSettings } = require('../lib/db')
    const allProducts = getAllProductsSorted()
    const catData = getCategoriesOrdered()
    const settings = getSettings()

    const catOrder = catData.map(c => c.category)
    allProducts.forEach(p => { if (p.category && !catOrder.includes(p.category)) catOrder.push(p.category) })

    let heroImages = []
    try { heroImages = JSON.parse(settings.hero_images || '[]') } catch {}

    return {
      props: {
        featured: allProducts.slice(0, 8).map(p => ({ ...p })),
        categories: catData
          .filter(c => allProducts.some(p => p.category === c.category))
          .map(c => ({ category: c.category, image: c.image || null })),
        settings,
        heroImages,
      },
    }
  } catch {
    return { props: { featured: [], categories: [], settings: {}, heroImages: [] } }
  }
}
