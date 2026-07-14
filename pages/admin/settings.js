import { useState } from 'react'
import Link from 'next/link'
import { getSession } from '../../lib/session'

const SECTIONS = [
  {
    title: 'Brand',
    icon: '🏷',
    fields: [
      { key: 'brand_name',    label: 'Brand Name',       type: 'text',     placeholder: 'Arambhika Enablers' },
      { key: 'brand_tagline', label: 'Tagline',           type: 'text',     placeholder: 'Nickel & Copper Battery Connectors...' },
      { key: 'brand_logo',    label: 'Logo URL',          type: 'text',     placeholder: 'https://... (leave blank for text logo)' },
    ],
  },
  {
    title: 'Contact & Social',
    icon: '📞',
    fields: [
      { key: 'wa_number', label: 'WhatsApp Number (no +)',  type: 'text', placeholder: '919315545821' },
      { key: 'phone1',    label: 'Phone 1',                 type: 'text', placeholder: '+91-9315545821' },
      { key: 'phone2',    label: 'Phone 2',                 type: 'text', placeholder: '+91-8112662827' },
      { key: 'phone3',    label: 'Phone 3 (optional)',      type: 'text', placeholder: '' },
      { key: 'email',     label: 'Email',                   type: 'text', placeholder: 'info@arambhikaenablers.in' },
      { key: 'address',   label: 'Address',                 type: 'textarea', placeholder: 'Plot No. C-03, Sector 4, Greater Noida...' },
    ],
  },
  {
    title: 'Homepage — Hero',
    icon: '🏠',
    fields: [
      { key: 'hero_title',    label: 'Hero Heading',         type: 'text',     placeholder: 'Nickel Strips & Copper Busbars...' },
      { key: 'hero_subtitle', label: 'Hero Subtext',         type: 'textarea', placeholder: 'Manufacturer and distributor...' },
      { key: 'hero_cta',      label: 'Primary CTA Button',   type: 'text',     placeholder: 'Browse Products' },
    ],
  },
  {
    title: 'Homepage — Bottom CTA',
    icon: '💬',
    fields: [
      { key: 'cta_title',    label: 'CTA Heading',    type: 'text',     placeholder: 'Need a custom quote?' },
      { key: 'cta_subtitle', label: 'CTA Subtext',    type: 'textarea', placeholder: 'Send us your specifications...' },
    ],
  },
  {
    title: 'About Us Page',
    icon: '🏢',
    fields: [
      { key: 'about_heading', label: 'Page Heading',    type: 'text',     placeholder: 'About Arambhika Enablers' },
      { key: 'about_content', label: 'Page Content',    type: 'textarea', placeholder: 'About us text...' },
    ],
  },
  {
    title: 'SEO / Meta',
    icon: '🔍',
    fields: [
      { key: 'site_title',       label: 'Site Title (browser tab & Google)',  type: 'text',     placeholder: 'Arambhika Enablers — Nickel Strip & Copper Busbar Manufacturer India' },
      { key: 'meta_description', label: 'Meta Description (Google snippet)',  type: 'textarea', placeholder: 'Shown below the site title in Google search results. Keep under 160 chars.' },
    ],
  },
]

export default function AdminSettings({ initialSettings }) {
  const [vals, setVals]     = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState('')

  const set = (key, value) => setVals(v => ({ ...v, [key]: value }))

  const save = async () => {
    setSaving(true); setMsg('')
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vals),
    })
    setSaving(false)
    setMsg(res.ok ? '✓ Published! Changes are live on the site.' : '✗ Failed to save.')
  }

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <h1>Arambhika Admin</h1>
        <nav className="admin-nav">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/products">Products</Link>
          <Link href="/admin/blogs">Blogs</Link>
          <Link href="/admin/settings" style={{ color: 'var(--accent)', fontWeight: 700 }}>Site Settings</Link>
          <Link href="/" target="_blank">View Site ↗</Link>
          <a href="/api/auth/logout" style={{ color: '#f87171' }}>Logout</a>
        </nav>
      </header>

      <div className="admin-content" style={{ maxWidth: 820, padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className="admin-page-title" style={{ marginBottom: 0 }}>Site Content &amp; Settings</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {msg && (
              <span style={{ fontSize: '0.85rem', color: msg.startsWith('✓') ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                {msg}
              </span>
            )}
            <button className="btn btn-primary" onClick={save} disabled={saving}
              style={{ padding: '0.6rem 1.8rem', fontSize: '0.95rem' }}>
              {saving ? 'Saving…' : '🚀 Save & Publish'}
            </button>
          </div>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
          Changes take effect immediately on the live site when you click <strong>Save &amp; Publish</strong>.
        </p>

        {SECTIONS.map(section => (
          <div key={section.title} className="settings-section">
            <h3 className="settings-section-title">
              <span>{section.icon}</span> {section.title}
            </h3>
            <div className="settings-fields">
              {section.fields.map(field => (
                <div key={field.key} className="settings-field">
                  <label className="settings-label">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      className="settings-textarea"
                      value={vals[field.key] || ''}
                      placeholder={field.placeholder}
                      rows={4}
                      onChange={e => set(field.key, e.target.value)}
                    />
                  ) : (
                    <input
                      className="settings-input"
                      type="text"
                      value={vals[field.key] || ''}
                      placeholder={field.placeholder}
                      onChange={e => set(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}
            style={{ padding: '0.75rem 2.5rem', fontSize: '1rem' }}>
            {saving ? 'Saving…' : '🚀 Save & Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session?.admin) return { redirect: { destination: '/admin', permanent: false } }
  const { getSettings } = require('../../lib/db')
  return { props: { initialSettings: getSettings() } }
}
