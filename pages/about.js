import Link from 'next/link'
import Layout from '../components/Layout'

export default function About({ settings }) {
  const WA      = settings.wa_number || '919315545821'
  const phone1  = settings.phone1 || '+91-9315545821'
  const phone2  = settings.phone2 || ''
  const phone3  = settings.phone3 || ''
  const email   = settings.email  || 'info@arambhikaenablers.in'
  const address = settings.address || 'Plot No. C-03, Sector 4, Greater Noida, UP – 201318'

  return (
    <Layout title="About Us" settings={settings}
      description={`${settings.brand_name || 'Arambhika Enablers'} — manufacturer and distributor of nickel strips and copper busbars in Greater Noida, India.`}>
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link><span>/</span><span>About Us</span>
        </div>

        <div className="about-grid">
          <div className="about-text">
            <h2>{settings.about_heading || 'Who We Are'}</h2>
            {(settings.about_content || '').split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            {!settings.about_content && (
              <>
                <p>{settings.brand_name || 'Arambhika Enablers'} is a manufacturer and distributor of nickel strips, copper busbars, and battery connectors, based in Greater Noida, Uttar Pradesh.</p>
                <p>We serve battery pack manufacturers, EV companies, and energy storage system (ESS) producers across India.</p>
              </>
            )}

            <div className="contact-cards" style={{ marginTop: '2rem' }}>
              <div className="contact-card">
                <h4>Sales Office</h4>
                <p>{address}</p>
              </div>
              <div className="contact-card">
                <h4>WhatsApp Orders</h4>
                <p><a href={`https://wa.me/${WA}`}>{phone1}</a></p>
              </div>
              {(phone2 || phone3) && (
                <div className="contact-card">
                  <h4>Phone</h4>
                  <p>
                    {phone2 && <><a href={`tel:${phone2.replace(/[^+\d]/g,'')}`}>{phone2}</a><br /></>}
                    {phone3 && <a href={`tel:${phone3.replace(/[^+\d]/g,'')}`}>{phone3}</a>}
                  </p>
                </div>
              )}
              {email && (
                <div className="contact-card">
                  <h4>Email</h4>
                  <p><a href={`mailto:${email}`}>{email}</a></p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem' }}>
              <a href={`https://wa.me/${WA}?text=Hi%2C%20I%20want%20to%20get%20in%20touch%20with%20Arambhika%20Enablers.`}
                className="btn btn-wa" target="_blank" rel="noopener noreferrer">
                Message Us on WhatsApp
              </a>
            </div>
          </div>

          <div>
            <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius)', padding: '2.5rem', color: '#fff' }}>
              <h3 style={{ marginBottom: '1.5rem', color: '#60a5fa' }}>Why {settings.brand_name || 'Arambhika'}?</h3>
              {[
                ['In-house manufacturing', 'Direct from our manufacturing facility'],
                ['All India delivery', 'We ship to battery manufacturers across India'],
                ['Fast response', 'WhatsApp quotes within 2 hours'],
                ['Bulk pricing', 'Competitive rates for volume orders'],
                ['54+ SKUs', 'Nickel plated, pure nickel, copper busbars & more'],
              ].map(([title, desc]) => (
                <div key={title} style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                  <span style={{ color: '#34d399', flexShrink: 0, marginTop: '2px' }}>✓</span>
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{title}</p>
                    <p style={{ fontSize: '0.88rem', opacity: 0.75 }}>{desc}</p>
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

export async function getServerSideProps() {
  try {
    const { getSettings } = require('../lib/db')
    return { props: { settings: getSettings() } }
  } catch {
    return { props: { settings: {} } }
  }
}
