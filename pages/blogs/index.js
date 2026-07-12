import Link from 'next/link'
import Layout from '../../components/Layout'
import { getAllBlogs } from '../../lib/db'

export default function Blogs({ blogs }) {
  return (
    <Layout title="Blogs" description="Articles and guides on nickel strips, copper busbars, battery pack manufacturing, and more.">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link><span>/</span><span>Blogs</span>
        </div>
        <section className="section">
          <h1 className="section-title">Blogs & Guides</h1>
          <p className="section-sub">Technical articles on battery connectors, materials, and manufacturing.</p>

          {blogs.length === 0 ? (
            <div className="empty-state">
              <h3>No posts yet</h3>
              <p>Publish your first blog from the <Link href="/admin/blogs">admin panel</Link>.</p>
            </div>
          ) : (
            <div className="blog-grid">
              {blogs.map(b => (
                <article key={b.id} className="blog-card">
                  <Link href={`/blogs/${b.slug}`}>
                    {b.cover_image
                      ? <img src={b.cover_image} alt={b.title} className="blog-card-img" loading="lazy" />
                      : <div className="blog-card-img" style={{ background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#60a5fa', fontSize: '2rem' }}>✍</span>
                        </div>
                    }
                  </Link>
                  <div className="blog-card-body">
                    <p className="blog-card-date">{new Date(b.published_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <h2 className="blog-card-title"><Link href={`/blogs/${b.slug}`}>{b.title}</Link></h2>
                    {b.excerpt && <p className="blog-card-excerpt">{b.excerpt}</p>}
                    <Link href={`/blogs/${b.slug}`} className="blog-card-link">Read more →</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}

export async function getServerSideProps() {
  try {
    const blogs = getAllBlogs()
    return { props: { blogs: blogs.map(b => ({ ...b })) } }
  } catch {
    return { props: { blogs: [] } }
  }
}
