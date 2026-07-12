import Link from 'next/link'
import Layout from '../components/Layout'

export default function About() {
  const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919315545821'

  return (
    <Layout title="About Us" description="Arambhika Enablers — manufacturer and distributor of nickel strips and copper busbars in Greater Noida, India.">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link><span>/</span><span>About Us</span>
        </div>

        <div className="about-grid">
          <div className="about-text">
            <h2>Who We Are</h2>
            <p>Arambhika Enablers is a manufacturer and distributor of nickel strips, copper busbars, and battery connectors, based in Greater Noida, Uttar Pradesh.</p>
            <p>We serve battery pack manufacturers, EV companies, and energy storage system (ESS) producers across India — providing quality materials with fast turnaround.</p>
            <p>Our manufacturing unit, Swastik Metal Components, is located at Plot No. 153, Udyog Kendra-II, Ecotech-III, Greater Noida.</p>

            <div className="contact-cards" style={{ marginTop: '2rem' }}>
              <div className="contact-card">
                <h4>Sales Office</h4>
                <p>Plot No. C-03, Sector 4<br />Greater Noida, UP – 201318</p>
              </div>
              <div className="contact-card">
                <h4>WhatsApp Orders</h4>
                <p><a href={`https://wa.me/${WA}`}>+91-9315545821</a></p>
              </div>
              <div className="contact-card">
                <h4>Phone</h4>
                <p>
                  <a href="tel:+918112662827">+91-8112662827</a><br />
                  <a href="tel:+919953255677">+91-9953255677</a>
                </p>
              </div>
              <div className="contact-card">
                <h4>Email</h4>
                <p><a href="mailto:info@arambhikaenablers.in">info@arambhikaenablers.in</a></p>
              </div>
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
              <h3 style={{ marginBottom: '1.5rem', color: '#60a5fa' }}>Why Arambhika?</h3>
              {[
                ['In-house manufacturing', 'Direct from our Swastik Metal Components facility'],
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
