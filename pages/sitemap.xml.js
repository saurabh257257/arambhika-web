export default function Sitemap() { return null }

export async function getServerSideProps({ res }) {
  const { getAllProductSlugs, getAllBlogSlugs } = require('../lib/db')
  const base = process.env.SITE_URL || 'https://arambhikaenablers.in'

  const staticPages = [
    { loc: base,          priority: '1.0', freq: 'weekly' },
    { loc: `${base}/store`,   priority: '0.9', freq: 'daily'  },
    { loc: `${base}/blogs`,   priority: '0.7', freq: 'weekly' },
    { loc: `${base}/about`,   priority: '0.6', freq: 'monthly'},
    { loc: `${base}/contact`, priority: '0.6', freq: 'monthly'},
  ]

  const products = getAllProductSlugs()
  const blogs    = getAllBlogSlugs()
  const now      = new Date().toISOString().split('T')[0]

  const urls = [
    ...staticPages.map(p => `
  <url>
    <loc>${p.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    ...products.map(p => `
  <url>
    <loc>${base}/store/${p.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`),
    ...blogs.map(b => `
  <url>
    <loc>${base}/blogs/${b.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate')
  res.write(xml)
  res.end()

  return { props: {} }
}
