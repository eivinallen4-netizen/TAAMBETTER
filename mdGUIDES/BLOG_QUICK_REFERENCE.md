# 🚀 Blog System Quick Reference

## 3-Step Process to Add a Blog

### Step 1: Add Thumbnail to `/public/blogs/`
```
public/blogs/
  └── is-your-agency-holding-you-back.png  ✅
  └── your-new-blog-slug.png               (add new ones here)
```

### Step 2: Update `app/content/siteContent.json`
Copy this template and fill in your values:

```json
{
  "id": 2,
  "slug": "url-friendly-slug",
  "title": "Your Blog Title",
  "excerpt": "One-two sentence summary shown in listings",
  "description": "<p>Full HTML content here</p><h3>Section</h3><p>More text...</p>",
  "thumbnail": "/blogs/url-friendly-slug.png",
  "author": "Author Name",
  "date": "2026-08-05",
  "readTime": "5 min read",
  "category": "Strategy",
  "published": true
}
```

### Step 3: Done! 🎉
Blog auto-appears at:
- **Homepage**: `/` (Insights & Ideas section)
- **Blog List**: `/blog`
- **Blog Post**: `/blog/your-url-friendly-slug`

## HTML Quick Snippets

```html
<p>Paragraph</p>
<h3>Section Title</h3>
<strong>Bold</strong> • <em>Italic</em>
<ul><li>Bullet</li></ul>
<ol><li>Numbered</li></ol>
<a href="url">Link</a>
```

## What Each Field Does

| Field | What it's for | Example |
|-------|---------------|---------|
| `id` | Unique number | `2` |
| `slug` | URL path | `how-to-scale-content` |
| `title` | Main headline | `How to Scale Content` |
| `excerpt` | Card preview | `Discover how we... ` |
| `description` | Full content | `<p>Long form...</p>` |
| `thumbnail` | Cover image | `/blogs/scale.png` |
| `author` | Writer name | `TAAM Team` |
| `date` | Publish date | `2026-08-05` |
| `readTime` | Est. read time | `5 min read` |
| `category` | Topic category | `Strategy` |
| `published` | Live/Draft | `true` or `false` |

## Best Practices

✅ Slug = lowercase, hyphens, descriptive  
✅ Categories consistent across blogs  
✅ Thumbnails 1200x630px, < 200KB  
✅ Use HTML tags, no markdown  
✅ Keep excerpts 2-3 sentences  

❌ Spaces in filenames  
❌ Mixed case in slug  
❌ Missing thumbnail file  
❌ Markdown in description field  

## Where Blogs Show

| Location | Shows | Limit |
|----------|-------|-------|
| Homepage | 3 newest | `limit: 3` |
| /blog | All published | Filtered by category |
| /blog/[slug] | Single post | Full content + related |

---

**More details?** Read [BLOG_SETUP.md](./BLOG_SETUP.md)
