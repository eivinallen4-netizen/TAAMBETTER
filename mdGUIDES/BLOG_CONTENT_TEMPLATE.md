# Blog Content Template

Use this template to create new blog posts. Copy the JSON structure below and replace with your content.

## Minimal Blog Entry

```json
{
  "id": 2,
  "slug": "your-blog-slug-here",
  "title": "Your Blog Title Here",
  "excerpt": "A short summary of your blog (2-3 sentences that appear in listings)",
  "description": "<p>Your full HTML blog content here</p>",
  "thumbnail": "/blogs/your-blog-slug-here.png",
  "author": "Author Name",
  "date": "2026-08-05",
  "readTime": "5 min read",
  "category": "Strategy",
  "published": true
}
```

## Full-Featured Blog Example

```json
{
  "id": 2,
  "slug": "how-to-scale-content-creation",
  "title": "How to Scale Content Creation Without Losing Quality",
  "excerpt": "Discover the systems we built to go from 10 to 100 pieces of content per month while maintaining brand voice and impact. Learn the playbook we use with our clients.",
  "description": "<h3>The Challenge</h3><p>Most agencies stop at one or the other: quality or quantity. You have to pick one. But what if you didn't?</p><p>When we started scaling content for clients, we hit the same wall. We could produce lots of content, but it felt generic. Or we could make premium work, but it took forever.</p><h3>The Real Problem</h3><p>The issue wasn't the team. It wasn't the tools. It was the <strong>process</strong>.</p><p>We were treating content like a manual craft when it should've been a machine that produces quality at scale.</p><h3>Our Solution</h3><p>We built a content engine with three layers:</p><ul><li><strong>Template Layer:</strong> Pre-built formats for reels, posts, captions</li><li><strong>Voice Layer:</strong> Brand guidelines that scaled without sounding robotic</li><li><strong>Production Layer:</strong> Systems that moved content from idea to publish in days, not weeks</li></ul><h3>The Results</h3><p>Clients went from <strong>10 posts per month to 100+</strong> without hiring 10x the team. Quality stayed consistent. Engagement actually improved because we had more chances to hit the algorithm.</p><h3>What Changed</h3><p>It wasn't magic. It was discipline:</p><ol><li>Standard formats reduced creative friction</li><li>Batch filming cut production time by 70%</li><li>Asset libraries meant no starting from zero</li><li>Clear workflows = faster turnarounds</li></ol><h3>The Takeaway</h3><p>If you're stuck choosing between quality and quantity, you haven't systematized your process yet. Once you do, that choice disappears.</p><p>Ready to scale without sacrificing quality? <a href=\"mailto:contact@taammarketing.com\">Let's talk</a>.</p>",
  "thumbnail": "/blogs/how-to-scale-content-creation.png",
  "author": "Content Strategy Team",
  "date": "2026-08-05",
  "readTime": "7 min read",
  "category": "Strategy",
  "published": true
}
```

## HTML Content Patterns

### Basic Structure
```html
<h3>Section Heading</h3>
<p>Paragraph of text. Use multiple paragraphs to break up content.</p>

<h3>Another Section</h3>
<p>More content here.</p>
```

### With Lists
```html
<h3>Our Process</h3>
<ol>
  <li>Step one with explanation</li>
  <li>Step two with explanation</li>
  <li>Step three with explanation</li>
</ol>

<h3>Key Benefits</h3>
<ul>
  <li><strong>Benefit 1:</strong> Description of benefit</li>
  <li><strong>Benefit 2:</strong> Description of benefit</li>
  <li><strong>Benefit 3:</strong> Description of benefit</li>
</ul>
```

### With Links
```html
<p>Here's <a href="https://example.com">a link to something important</a> that readers might find useful.</p>

<p>Internal link example: <a href="mailto:contact@taammarketing.com">contact us</a></p>
```

### With Emphasis
```html
<p>This is <strong>very important</strong> and this is <em>emphasized</em>.</p>

<p>You can combine them: <strong><em>really important</em></strong></p>
```

### Complete Blog with Problem/Solution/Results
```html
<h3>The Challenge</h3>
<p>Describe the customer's problem before working with TAAM.</p>

<h3>The Solution</h3>
<p>Describe what we did to solve it.</p>

<h3>The Results</h3>
<p>Describe the measurable outcomes and impact.</p>

<h3>Key Takeaway</h3>
<p>End with the insight or lesson learned.</p>
```

## Metadata Guide

### slug
- Used in URL: `/blog/{slug}`
- Rules: lowercase, hyphens, no spaces
- Examples: `is-your-agency-holding-you-back`, `how-to-scale-content`

### title
- Main headline (60 characters max for Google preview)
- Be specific, not generic
- Examples: ✅ `How to Scale Content Without Losing Quality` vs ❌ `Content Tips`

### excerpt
- Preview text for listings and metadata (155-160 characters)
- 2-3 sentences max
- Include the value proposition
- Examples: ✅ `Discover how we scaled from 10 to 100 pieces of content per month` vs ❌ `This blog is about scaling`

### date
- Publication date in YYYY-MM-DD format
- Use the day blog goes live
- Example: `2026-08-05`

### readTime
- Estimated reading time
- Format: `X min read`
- General rule: ~200 words per minute
- Examples: `5 min read`, `7 min read`, `10 min read`

### category
- Topic classification for filtering
- Use 2-4 consistent categories across all blogs
- Examples: `Strategy`, `Tips`, `News`, `Case Study`, `Design`, `Development`

### author
- Who wrote or is associated with the blog
- Can be individual name or "TAAM Team"
- Examples: `Content Strategy Team`, `TAAM Team`, `John Smith`

### thumbnail
- Path to blog cover image
- Must match file in `/public/blogs/`
- Format: `/blogs/{filename}`
- Example: `/blogs/is-your-agency-holding-you-back.png`

### published
- `true`: Blog is live and visible
- `false`: Blog is draft (won't show anywhere)
- Useful for scheduling content

## Copy-Paste Ready Template

Replace everything in `{}` with your content:

```json
{
  "id": {NEXT_NUMBER},
  "slug": "{slug-format-like-this}",
  "title": "{Your Blog Title Goes Here}",
  "excerpt": "{2-3 sentence summary that appears in blog listings and search results}",
  "description": "<h3>{First Main Point}</h3><p>{Explanation...}</p><h3>{Second Main Point}</h3><p>{Explanation...}</p><h3>{Key Takeaway}</h3><p>{Final thought with CTA if relevant}</p>",
  "thumbnail": "/blogs/{matching-filename}.png",
  "author": "{Author Name or 'TAAM Team'}",
  "date": "2026-08-{DATE}",
  "readTime": "{5-10} min read",
  "category": "{Strategy/Tips/News/CaseStudy}",
  "published": true
}
```

## Tips for Writing Great Blog Content

### Headlines
- Make them specific and benefit-driven
- Use "how to," "why," "guide," "tips" when appropriate
- Ask questions if relevant: "Is Your Agency Holding You Back?"

### Opening Paragraph
- Hook the reader immediately
- Identify the problem they have
- Promise a solution by the end

### Body
- Use short paragraphs (2-4 sentences)
- Break up content with subheadings
- Use lists for multiple points
- Include examples and stories

### Closing
- Summarize the key insight
- End with a call-to-action or next step
- Link to: contact form, other resources, book a call

### For TAAM's Voice
- Be direct and specific, not vague
- Use data and proof points
- Tell stories from real client work
- Focus on results, not process
- Address real problems your audience has

---

Ready to add your first blog? Update the `blogs` array in `app/content/siteContent.json` and your blog goes live immediately!
