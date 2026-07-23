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
            <a href={`tel:${phone1.replace(/[^+\d]/g,'')}`} className="btn-call-nav" title={phone1}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
              {phone1}
            </a>
            <a href={`https://wa.me/${WA}`} className="btn-wa-nav" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.07-1.35C8.44 21.51 10.18 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.72 0-3.33-.46-4.72-1.27l-.34-.2-3.52.93.95-3.43-.22-.36C3.46 15.33 3 13.72 3 12 3 7.03 7.03 3 12 3s9 4.03 9 9-4.03 9-9 9z"/></svg>
              WhatsApp
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
