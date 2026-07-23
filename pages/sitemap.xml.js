const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://arambhikaenablers.in'

function urlEntry(loc, priority = '0.7', changefreq = 'weekly') {
  return `  <url><loc>${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
}

export default function Sitemap() { return null }

export async function getServerSideProps({ res }) {
  const { getAllProductSlugs, getCategoriesOrdered } = require('../lib/db')

  const slugs      = getAllProductSlugs().map(r => r.slug)
  const categories = getCategoriesOrdered().map(c => c.category)

  const entries = [
    urlEntry(`${SITE_URL}`,         '1.0', 'daily'),
    urlEntry(`${SITE_URL}/store`,   '0.9', 'daily'),
    urlEntry(`${SITE_URL}/blogs`,   '0.7', 'weekly'),
    urlEntry(`${SITE_URL}/about`,   '0.6', 'monthly'),
    urlEntry(`${SITE_URL}/contact`, '0.6', 'monthly'),
    ...categories.map(c => urlEntry(`${SITE_URL}/store?category=${encodeURIComponent(c)}`, '0.8', 'weekly')),
    ...slugs.map(s => urlEntry(`${SITE_URL}/store/${s}`, '0.8', 'weekly')),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`

  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
  res.write(xml)
  res.end()
  return { props: {} }
}
