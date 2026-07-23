import Layout from '../components/Layout'

export default function Contact({ settings = {} }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://arambhikaenablers.in'
  const brand   = settings.brand_name || 'Arambhika Enablers'
  const address = settings.address    || 'Plot No. C-03, Sector 4, Greater Noida, UP – 201318'
  const phone1  = settings.phone1     || '+91-9315545821'
  const phone2  = settings.phone2     || '+91-8112662827'
  const phone3  = settings.phone3     || '+91-9953255677'
  const email   = settings.email      || 'info@arambhikaenablers.in'
  const WA      = settings.wa_number  || '919315545821'

  const contactLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${brand}`,
    url: `${siteUrl}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: brand,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Plot No. C-03, Sector 4',
        addressLocality: 'Greater Noida',
        addressRegion: 'Uttar Pradesh',
        postalCode: '201318',
        addressCountry: 'IN',
      },
      telephone: phone1,
      email,
    },
  }

  return (
    <Layout
      title="Contact Us"
      description={`Get in touch with ${brand}. Call, WhatsApp, or email us for nickel strip and copper busbar enquiries. Based in Greater Noida, UP.`}
      ogUrl={`${siteUrl}/contact`}
      settings={settings}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactLd) }} />

      <div className="container" style={{ maxWidth: 760, padding: '3rem 1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem' }}>Contact Us</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2.5rem' }}>
          Reach us on WhatsApp for the fastest response — typically within 2 hours.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div className="contact-card">
            <h4>Office Address</h4>
            <p>{address}</p>
          </div>
          <div className="contact-card">
            <h4>Phone / WhatsApp</h4>
            {phone1 && <p><a href={`tel:${phone1.replace(/[^+\d]/g,'')}`}>{phone1}</a></p>}
            {phone2 && <p><a href={`tel:${phone2.replace(/[^+\d]/g,'')}`}>{phone2}</a></p>}
            {phone3 && <p><a href={`tel:${phone3.replace(/[^+\d]/g,'')}`}>{phone3}</a></p>}
          </div>
          <div className="contact-card">
            <h4>Email</h4>
            <p><a href={`mailto:${email}`}>{email}</a></p>
          </div>
        </div>

        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href={`https://wa.me/${WA}?text=Hi%2C%20I%20have%20an%20enquiry`}
            className="btn btn-wa" target="_blank" rel="noopener noreferrer">
            WhatsApp Us
          </a>
          <a href={`mailto:${email}`}
            style={{ padding: '0.65rem 1.5rem', border: '1.5px solid var(--border)', borderRadius: 8, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
            Send Email
          </a>
        </div>

        <div style={{ marginTop: '2.5rem', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <iframe
            title="Arambhika Enablers location"
            src="https://maps.google.com/maps?q=Sector+4+Greater+Noida+UP+201318&output=embed"
            width="100%" height="300" style={{ border: 0, display: 'block' }}
            loading="lazy" referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps() {
  try {
    const { getSettings } = require('../lib/db')
    return { props: { settings: getSettings() } }
  } catch {
    return { props: { settings: {} } }
  }
}
