import Link from 'next/link';
import Arrow from '@/components/editorial/Arrow';
import { BLOG_BASE_PATH } from '../constants';
import { formatDate } from '../format';
import type { BlogPost } from '../local-posts';

export function ArticleCard({ article }: { article: BlogPost }) {
  return (
    <li className="border-b-2 rule">
      <Link
        href={`${BLOG_BASE_PATH}/${article.slug}`}
        className="group grid gap-4 py-10 md:grid-cols-12 md:gap-8"
      >
        <time dateTime={article.published_at} className="eyebrow opacity-70 md:col-span-3 md:pt-2">
          {formatDate(article.published_at)}
        </time>
        <div className="md:col-span-8">
          <h2 className="display display-sm hover-outline">{article.title}</h2>
          {article.meta_description && (
            <p className="mt-4 line-clamp-3 text-[color:var(--tone-muted)]">{article.meta_description}</p>
          )}
        </div>
        <span className="hidden md:col-span-1 md:flex md:justify-end md:pt-2 transition-transform duration-500 group-hover:translate-x-2">
          <Arrow />
        </span>
      </Link>
    </li>
  );
}
