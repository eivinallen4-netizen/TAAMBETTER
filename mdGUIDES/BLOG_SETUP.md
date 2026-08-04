# Blog System Setup Guide

Your blog system is now fully functional! Here's everything you need to know to manage and add blogs.

## File Structure

```
app/
  blog/
    page.tsx              # Blog listing page
    [slug]/
      page.tsx           # Individual blog post page
  content/
    siteContent.json     # All blog content lives here
components/
  sections/
    BlogSection.tsx      # Homepage blog section component
public/
  blogs/                 # Blog thumbnails go here
    blog-slug.png
```

## How to Add a New Blog

### 1. **Prepare Your Blog Thumbnail**
   - Create or export your blog thumbnail as an image (PNG, JPG, WebP recommended)
   - Place it in `/public/blogs/` directory
   - Name it descriptively (e.g., `is-your-agency-holding-you-back.png`)

### 2. **Add Blog Entry to siteContent.json**

Open `app/content/siteContent.json` and add a new entry to the `"blogs"` array:

```json
{
  "id": 2,
  "slug": "your-blog-slug-here",
  "title": "Your Blog Title Here",
  "excerpt": "A short summary of your blog (2-3 sentences)",
  "description": "<p>Your full HTML blog content here</p><h3>Section Title</h3><p>More content...</p>",
  "thumbnail": "/blogs/your-blog-slug-here.png",
  "author": "Author Name",
  "date": "2026-08-03",
  "readTime": "5 min read",
  "category": "Strategy",
  "published": true
}
```

### 3. **Understand Each Field**

| Field | Description | Example |
|-------|-------------|---------|
| `id` | Unique identifier (increment from last blog) | `2` |
| `slug` | URL-friendly version of title (used in URL) | `is-your-agency-holding-you-back` |
| `title` | Blog post title | `Is Your Agency Holding You Back?` |
| `excerpt` | Short preview text (shows in listings) | `Most agencies work in isolation...` |
| `description` | Full blog content (HTML) | `<p>Long form content...</p>` |
| `thumbnail` | Path to blog image | `/blogs/agency-holding-back.png` |
| `author` | Who wrote it | `TAAM Team` or specific name |
| `date` | Publication date (YYYY-MM-DD) | `2026-08-03` |
| `readTime` | Estimated reading time | `5 min read` |
| `category` | Blog category (for filtering) | `Strategy`, `Tips`, `News`, etc. |
| `published` | Draft/Live status | `true` or `false` |

## Writing Blog Content in HTML

Your blog description supports full HTML. Here are common patterns:

```html
<!-- Paragraphs -->
<p>Regular paragraph text.</p>

<!-- Headings -->
<h3>Section Heading</h3>
<h4>Subsection</h4>

<!-- Bold & Italic -->
<strong>Bold text</strong>
<em>Italic text</em>

<!-- Lists -->
<ul>
  <li>Bullet point one</li>
  <li>Bullet point two</li>
</ul>

<ol>
  <li>Numbered item</li>
  <li>Another item</li>
</ol>

<!-- Links -->
<a href="https://example.com">Link text</a>

<!-- Line breaks -->
<br>
```

## Blog Display Locations

### 1. **Homepage**
   - Shows 3 most recent blogs in "Insights & Ideas" section
   - Displays before CTA section
   - Each card shows: thumbnail, category badge, title, excerpt, date, read time

### 2. **Blog Listing Page** (`/blog`)
   - Shows all published blogs in a list layout
   - Includes category filtering
   - Shows: thumbnail, category, date, read time, excerpt, title
   - Features "Read Article" hover state

### 3. **Individual Blog Post** (`/blog/[slug]`)
   - Full-width blog content
   - Shows: title, category, date, author, read time
   - Features featured image
   - Shows related articles at bottom
   - Related articles filtered by category, falls back to recent blogs

## Features & Automation

✅ **Automatic URL Generation**
- Blog slug automatically becomes the URL (e.g., `/blog/is-your-agency-holding-you-back`)
- Update only the `slug` field in JSON, no file management needed

✅ **Category Filtering**
- Blog listing page automatically creates filter buttons from categories
- Users can filter by category or view "All"

✅ **Related Articles**
- Related articles show at bottom of each blog post
- Automatically displays 2 articles from same category
- Falls back to 2 most recent if no matching category

✅ **Draft/Publish Control**
- Set `"published": false` to hide a blog (keeps it in CMS)
- Set `"published": true` to make it live
- Great for scheduling content

✅ **Responsive Design**
- Works on mobile, tablet, and desktop
- Blog images auto-scale
- Typography scales with screen size

## Tips for Great Blogs

### SEO
- Use descriptive titles (60 characters or less for Google preview)
- Write compelling excerpts (155-160 characters for preview)
- Use headers (h3, h4) to break up content
- Include internal links when relevant

### Content Structure
- Start with a hook/problem statement
- Use clear section headings
- Keep paragraphs short (2-4 sentences max)
- Use lists for multiple points
- End with a call-to-action or takeaway

### Thumbnails
- Use consistent dimensions (1200x630px recommended)
- Maintain TAAM brand colors (orange #F46325)
- Include clear, readable text if possible
- Optimize file size (< 200KB)

### Categories
- Keep categories consistent (e.g., Strategy, Tips, Case Study, News)
- Use 1-3 categories across all blogs
- Helps with filtering and discoverability

## Examples

### Blog with All Features
```json
{
  "id": 2,
  "slug": "how-to-scale-content-creation",
  "title": "How to Scale Content Creation Without Losing Quality",
  "excerpt": "Discover the systems we built to go from 10 to 100 pieces of content per month while maintaining brand voice and impact.",
  "description": "<h3>The Challenge</h3><p>Most agencies stop at quality or quantity. You have to pick one.</p><h3>Our Solution</h3><p>We built a content engine that does both...</p>",
  "thumbnail": "/blogs/scale-content-creation.png",
  "author": "Content Team",
  "date": "2026-08-05",
  "readTime": "7 min read",
  "category": "Strategy",
  "published": true
}
```

## Troubleshooting

**Blog not showing on homepage?**
- Check that `published: true` in JSON
- Check that blog is in the `blogs` array
- Refresh the page (clear browser cache if needed)

**Blog not accessible at URL?**
- Verify the `slug` matches the URL (no spaces, lowercase)
- Check for typos in slug
- Make sure `published: true`

**Images not loading?**
- Verify file exists in `/public/blogs/`
- Check path in `thumbnail` field matches exactly
- Ensure filename has correct extension (`.png`, `.jpg`, etc.)

**Styling issues?**
- HTML should be plain HTML (no markdown)
- Use `<p>` tags for paragraphs, not just text
- Use semantic tags: `<h3>`, `<h4>`, `<strong>`, `<em>`, `<ul>`, `<ol>`, `<li>`

## Navigation

Navigation automatically includes "Blog" link once blogs are set up:
- Desktop: Appears in top navigation bar
- Mobile: Appears in mobile menu
- No additional config needed!

---

**Questions?** Check your siteContent.json structure or review the first blog entry for reference.
