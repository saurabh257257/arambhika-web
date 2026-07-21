import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function Layout({ children, title, description, ogImage, ogUrl, canonical, settings = {} }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const brandName  = settings.brand_name    || 'Arambhika Enablers'
  const tagline    = settings.brand_tagline || 'Nickel & Copper Battery Connectors'
  const brandLogo  = settings.brand_logo    || ''
  const WA         = settings.wa_number     || '919315545821'
  const phone1     = settings.phone1        || '+91-9315545821'
  const phone2     = settings.phone2        || '+91-8112662827'
  const phone3     = settings.phone3        || ''
  const email      = settings.email         || 'info@arambhikaenablers.in'
  const address    = settings.address       || 'Plot No. C-03, Sector 4, Greater Noida, UP – 201318'
  const metaDefault = settings.meta_description || `Manufacturer and distributor of nickel strips, copper busbars, and battery connectors. Based in Greater Noida.`

  const defaultSiteTitle = settings.site_title || `${brandName} — Nickel Strip & Copper Busbar Manufacturer`
  const siteTitle = title ? `${title} | ${brandName}` : defaultSiteTitle
  const metaDesc  = description || metaDefault
  const canonicalUrl = canonical || ogUrl || null
  const ogImg = ogImage || '/og-default.svg'

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{siteTitle}</title>
        <meta name="description" content={metaDesc} />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={ogImg} />
        {ogUrl && <meta property="og:url" content={ogUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={ogImg} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </Head>

      <header className="site-header">
        <div className="nav-inner">
          <Link href="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
            {brandLogo
              ? <img src={brandLogo} alt={brandName} style={{ height: 40, objectFit: 'contain' }} />
              : <>{brandName.split(' ')[0]} <span>{brandName.split(' ').slice(1).join(' ')}</span></>
            }
          </Link>
          <nav>
            <ul className="nav-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/store">Store</Link></li>
              <li><Link href="/blogs">Blogs</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </nav>
          <div className="nav-contact">
            <a href={`https://wa.me/${WA}`} className="btn-wa-nav" target="_blank" rel="noopener noreferrer">
              WhatsApp Order
            </a>
            <button className="nav-hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
        {/* Mobile menu drawer */}
        {menuOpen && (
          <div className="nav-mobile-menu" onClick={() => setMenuOpen(false)}>
            <Link href="/">Home</Link>
            <Link href="/store">Store</Link>
            <Link href="/blogs">Blogs</Link>
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact</Link>
            <a href={`https://wa.me/${WA}`} className="nav-mobile-wa" target="_blank" rel="noopener noreferrer">
              WhatsApp Order
            </a>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <h3>{brandName}</h3>
            <p>{tagline}</p>
            {address && <p style={{ marginTop: '1rem' }}>{address.replace(/,\s*/g, ',\n').split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}</p>}
          </div>
          <div className="footer-col">
            <h4>Pages</h4>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/store">Product Store</Link></li>
              <li><Link href="/blogs">Blogs</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              {phone1 && <li><a href={`tel:${phone1.replace(/[^+\d]/g,'')}`}>{phone1}</a></li>}
              {phone2 && <li><a href={`tel:${phone2.replace(/[^+\d]/g,'')}`}>{phone2}</a></li>}
              {phone3 && <li><a href={`tel:${phone3.replace(/[^+\d]/g,'')}`}>{phone3}</a></li>}
              {email  && <li><a href={`mailto:${email}`}>{email}</a></li>}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} {brandName}. All rights reserved.
        </div>
      </footer>
    </>
  )
}
