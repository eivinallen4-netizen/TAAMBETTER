'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import siteContent from '../content/siteContent.json';
import Container from '@/components/ui/Container';
import Text from '@/components/ui/Text';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import CTASection from '@/components/sections/CTASection';
import Title from '@/components/ui/Title';
import { stripHtml } from '@/lib/text-utils';

export default function Blog() {
  const content = siteContent;
  const [activeCategory, setActiveCategory] = useState('All');

  const publishedBlogs = useMemo(
    () => content.blogs.filter((b) => b.published !== false),
    [content.blogs]
  );

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(publishedBlogs.map((b) => b.category)))],
    [publishedBlogs]
  );

  const filteredBlogs = useMemo(
    () =>
      activeCategory === 'All'
        ? publishedBlogs
        : publishedBlogs.filter((b) => b.category === activeCategory),
    [publishedBlogs, activeCategory]
  );

  return (
    <div className="bg-black text-white">
      {/* Hero Section */}
      <section className="border-b border-gray-800">
        <Container className="py-20 md:py-28">
          <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
            {content.hero.blog.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl">
            {content.hero.blog.subtitle}
          </p>
        </Container>
      </section>

      {/* Filters + count */}
      <section className="max-w-7xl mx-auto px-6 pt-14">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-full border transition ${
                  activeCategory === category
                    ? 'bg-[#F46325] border-[#F46325] text-white'
                    : 'border-gray-700 text-gray-400 hover:border-[#F46325] hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {filteredBlogs.length} article{filteredBlogs.length === 1 ? '' : 's'}
          </span>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="space-y-8">
          {filteredBlogs.length > 0 ? (
            filteredBlogs.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`}>
                <article className="group bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden hover:border-[#F46325] transition hover:bg-gray-900/70">
                  <div className="flex flex-col md:flex-row">
                    {/* Thumbnail */}
                    {blog.thumbnail && (
                      <div className="w-full md:w-48 h-48 md:h-40 flex-shrink-0 overflow-hidden">
                        <img
                          src={blog.thumbnail}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap gap-3 mb-3">
                          <Badge className="text-orange-400">{blog.category}</Badge>
                          <span className="text-xs text-gray-500">{blog.date}</span>
                          <span className="text-xs text-gray-500">{blog.readTime}</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-[#F46325] transition">
                          {blog.title}
                        </h3>
                        <p className="text-gray-400 text-base line-clamp-2">
                          {blog.excerpt}
                        </p>
                      </div>
                      <div className="mt-4 text-sm font-semibold text-orange-400 opacity-0 group-hover:opacity-100 transition">
                        READ ARTICLE →
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No articles in this category yet.</p>
            </div>
          )}
        </div>
      </section>

      <CTASection
        title="READY TO GROW?"
        description="Tell us the problem you're trying to solve. We'll be straight with you about whether we're the right team to solve it—and what success actually looks like."
        variant="work"
      />
    </div>
  );
}
