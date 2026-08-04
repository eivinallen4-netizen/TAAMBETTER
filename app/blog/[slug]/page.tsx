import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import siteContent from '../../content/siteContent.json';
import Container from '@/components/ui/Container';
import Text from '@/components/ui/Text';
import Badge from '@/components/ui/Badge';
import CTASection from '@/components/sections/CTASection';
import Title from '@/components/ui/Title';
import Button from '@/components/ui/Button';
import GoogleDocContent from '@/components/GoogleDocContent';
import { fetchGoogleDoc } from '@/app/lib/google-docs';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return siteContent.blogs.map((blog) => ({
    slug: blog.slug,
  }));
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params;
  const blog = siteContent.blogs.find((b) => b.slug === slug);

  if (!blog || blog.published === false) {
    notFound();
  }

  let googleDocContent = null;

  if ((blog as any).googleDocId) {
    try {
      googleDocContent = await fetchGoogleDoc((blog as any).googleDocId);
    } catch (error) {
      console.error(`Failed to fetch Google Doc for blog ${slug}:`, error);
    }
  }

  const otherBlogs = siteContent.blogs.filter(
    (b) => b.published !== false && b.id !== blog.id
  );

  const relatedBlogs = otherBlogs.filter((b) => b.category === blog.category).slice(0, 2);
  const fallbackBlogs = otherBlogs.slice(0, 2);
  const suggestedBlogs = relatedBlogs.length > 0 ? relatedBlogs : fallbackBlogs;

  return (
    <div className="bg-black text-white">
      {/* Header with back link */}
      <Container className="pt-8 pb-4">
        <Link href="/blog">
          <button className="text-sm text-gray-400 hover:text-[#F46325] transition flex items-center gap-2">
            ← Back to articles
          </button>
        </Link>
      </Container>

      {/* Hero Section */}
      <section className="border-b border-gray-800">
        <Container className="py-12 md:py-20">
          <div className="max-w-3xl">
            {/* Meta info */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Badge className="text-orange-400">{blog.category}</Badge>
              <span className="text-sm text-gray-500">{blog.date}</span>
              <span className="text-sm text-gray-500">{blog.readTime}</span>
              <span className="text-sm text-gray-500">By {blog.author}</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              {blog.title}
            </h1>

            {/* Excerpt */}
            <p className="text-lg md:text-xl text-gray-400 mb-8">
              {blog.excerpt}
            </p>
          </div>
        </Container>
      </section>

      {/* Featured Image */}
      {blog.thumbnail && (
        <section className="border-b border-gray-800">
          <Container className="py-8">
            <div className="relative w-full h-96 md:h-[500px] rounded-lg overflow-hidden">
              <img
                src={blog.thumbnail}
                alt={blog.title}
                className="w-full h-full object-contain"
              />
            </div>
          </Container>
        </section>
      )}

      {/* Content */}
      <section className="py-12 md:py-20 border-b border-gray-800">
        <Container>
          {googleDocContent ? (
            <GoogleDocContent html={googleDocContent.html} />
          ) : (
            <div className="max-w-3xl">
              <div
                className="prose prose-invert max-w-none text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: blog.description }}
              />
            </div>
          )}
        </Container>
      </section>

      {/* Author bio section */}
      <section className="py-12 md:py-16 border-b border-gray-800 bg-gray-900/50">
        <Container>
          <div className="max-w-3xl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F46325] to-orange-700 flex items-center justify-center text-white font-bold text-lg">
                {blog.author.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg">{blog.author}</h3>
                <p className="text-gray-400">Marketing expert at TAAM</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Related Articles */}
      {suggestedBlogs.length > 0 && (
        <section className="py-16 md:py-24 border-b border-gray-800">
          <Container>
            <h2 className="text-3xl md:text-4xl font-black mb-12">More Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {suggestedBlogs.map((relatedBlog) => (
                <Link key={relatedBlog.id} href={`/blog/${relatedBlog.slug}`}>
                  <article className="group h-full">
                    {relatedBlog.thumbnail && (
                      <div className="relative w-full h-64 rounded-lg overflow-hidden mb-4">
                        <img
                          src={relatedBlog.thumbnail}
                          alt={relatedBlog.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    )}
                    <Badge className="text-orange-400 mb-3">{relatedBlog.category}</Badge>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-[#F46325] transition line-clamp-2">
                      {relatedBlog.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {relatedBlog.excerpt}
                    </p>
                    <div className="text-sm font-semibold text-orange-400 opacity-0 group-hover:opacity-100 transition">
                      READ ARTICLE →
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      <CTASection
        title="READY TO GROW?"
        description="Tell us the problem you're trying to solve. We'll be straight with you about whether we're the right team to solve it—and what success actually looks like."
        variant="work"
      />
    </div>
  );
}
