'use client';

import Link from 'next/link';
import Container from '../ui/Container';
import Title from '../ui/Title';
import Text from '../ui/Text';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { motion } from 'motion/react';
import { slideInLeftScroll, slideInRightScroll } from '@/lib/motion-animations';

interface BlogItem {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  thumbnail?: string;
  category: string;
  date: string;
  readTime: string;
  published?: boolean;
}

interface BlogSectionProps {
  blogs: BlogItem[];
  limit?: number;
}

export default function BlogSection({ blogs, limit = 3 }: BlogSectionProps) {
  const publishedBlogs = blogs
    .filter((b) => b.published !== false)
    .slice(0, limit);

  if (publishedBlogs.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-900/50 border-t border-b border-gray-800 py-16 md:py-24">
      <Container>
        {/* Header */}
        <motion.div
          variants={slideInLeftScroll}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: false, amount: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-4">Insights & Ideas</h2>
          <p className="text-gray-400 text-lg max-w-2xl">
            Stories, strategies, and lessons learned from growing real businesses.
          </p>
        </motion.div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {publishedBlogs.map((blog, index) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: false, amount: 0.3 }}
            >
              <Link href={`/blog/${blog.slug}`}>
                <article className="group h-full flex flex-col bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 hover:border-[#F46325] transition">
                  {/* Thumbnail */}
                  {blog.thumbnail && (
                    <div className="relative w-full h-48 overflow-hidden">
                      <img
                        src={blog.thumbnail}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 p-6 flex flex-col">
                    <div className="mb-3">
                      <Badge className="text-orange-400">{blog.category}</Badge>
                    </div>

                    <h3 className="text-lg font-bold mb-3 group-hover:text-[#F46325] transition line-clamp-2">
                      {blog.title}
                    </h3>

                    <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-grow">
                      {blog.excerpt}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-700 pt-4">
                      <span>{blog.date}</span>
                      <span>{blog.readTime}</span>
                    </div>

                    <div className="mt-4 text-sm font-semibold text-orange-400 opacity-0 group-hover:opacity-100 transition">
                      READ ARTICLE →
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div
          variants={slideInLeftScroll}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: false, amount: 0.3 }}
          className="text-center"
        >
          <Link href="/blog">
            <Button variant="primary">View All Articles</Button>
          </Link>
        </motion.div>
      </Container>
    </section>
  );
}
