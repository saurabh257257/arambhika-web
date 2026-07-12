import Head from 'next/head'
import Link from 'next/link'

export default function Layout({ children, title, description, ogImage, ogUrl }) {
  const WA = '919315545821'
  const siteTitle = title ? `${title} | Arambhika Enablers` : 'Arambhika Enablers — Nickel Strip & Copper Busbar Manufacturer'
  const metaDesc = description || 'Manufacturer and distributor of nickel strips, copper busbars, and battery connectors. Based in Greater Noida. Serving EV, ESS, and battery pack manufacturers across India.'

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{siteTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:type" content="website" />
        {ogImage && <meta property="og:image" content={ogImage} />}
        {ogUrl && <meta property="og:url" content={ogUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="site-header">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            Arambhika <span>Enablers</span>
          </Link>
          <nav>
            <ul className="nav-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/store">Store</Link></li>
              <li><Link href="/blogs">Blogs</Link></li>
              <li><Link href="/about">About Us</Link></li>
            </ul>
          </nav>
          <div className="nav-contact">
            <a href={`https://wa.me/${WA}`} className="btn-wa-nav" target="_blank" rel="noopener noreferrer">
              WhatsApp Order
            </a>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <h3>Arambhika Enablers</h3>
            <p>Manufacturer and distributor of nickel strips, copper busbars, and battery connectors. Serving EV and ESS manufacturers across India.</p>
            <p style={{ marginTop: '1rem' }}>
              Plot No. C-03, Sector 4,<br />Greater Noida, UP – 201318
            </p>
          </div>
          <div className="footer-col">
            <h4>Pages</h4>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/store">Product Store</Link></li>
              <li><Link href="/blogs">Blogs</Link></li>
              <li><Link href="/about">About Us</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="tel:+919315545821">+91-9315545821</a></li>
              <li><a href="tel:+918112662827">+91-8112662827</a></li>
              <li><a href="tel:+919953255677">+91-9953255677</a></li>
              <li><a href="mailto:info@arambhikaenablers.in">info@arambhikaenablers.in</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Arambhika Enablers. All rights reserved.
        </div>
      </footer>
    </>
  )
}
