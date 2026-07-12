import Link from 'next/link'
import Layout from '../../components/Layout'
import { getBlogBySlug } from '../../lib/db'

export default function BlogPost({ blog, siteUrl }) {
  if (!blog) return null

  return (
    <Layout
      title={blog.title}
      description={blog.excerpt || blog.title}
      ogImage={blog.cover_image || null}
      ogUrl={`${siteUrl}/blogs/${blog.slug}`}
    >
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link><span>/</span>
          <Link href="/blogs">Blogs</Link><span>/</span>
          <span>{blog.title}</span>
        </div>

        <article>
          <div className="blog-post-header">
            <h1>{blog.title}</h1>
            <p className="blog-post-meta">
              Published {new Date(blog.published_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '} Arambhika Enablers
            </p>
          </div>

          {blog.cover_image && (
            <img src={blog.cover_image} alt={blog.title} className="blog-cover" />
          )}

          <div className="blog-content"
            dangerouslySetInnerHTML={{ __html: blog.content?.replace(/\n/g, '<br/>') || '' }}
          />
        </article>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: '3rem', paddingTop: '2rem' }}>
          <Link href="/blogs" style={{ color: 'var(--accent)', fontWeight: 600 }}>← Back to all posts</Link>
        </div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps({ params }) {
  try {
    const blog = getBlogBySlug(params.slug)
    if (!blog) return { notFound: true }
    return {
      props: {
        blog: { ...blog },
        siteUrl: process.env.SITE_URL || 'https://www.arambhikaenablers.in',
      },
    }
  } catch {
    return { notFound: true }
  }
}
