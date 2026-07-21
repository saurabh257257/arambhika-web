import Link from 'next/link'
import Layout from '../components/Layout'

export default function NotFound({ settings = {} }) {
  return (
    <Layout title="Page Not Found" settings={settings}
      description="The page you're looking for doesn't exist. Browse our nickel strips and copper busbars at Arambhika Enablers.">
      <div className="container" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
        <p style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--border)', lineHeight: 1 }}>404</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>Page not found</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/store" className="btn btn-primary">Browse Products</Link>
          <Link href="/" style={{ padding: '0.65rem 1.5rem', border: '1.5px solid var(--border)', borderRadius: 8, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>Go Home</Link>
        </div>
      </div>
    </Layout>
  )
}

export async function getStaticProps() {
  try {
    const { getSettings } = require('../lib/db')
    return { props: { settings: getSettings() } }
  } catch {
    return { props: { settings: {} } }
  }
}
