# ✅ Blog Management Checklist

Use this checklist when adding new blogs or managing existing ones.

## Pre-Publishing Checklist

### Content Preparation
- [ ] Blog title is specific and benefit-driven (60 chars max)
- [ ] Excerpt is compelling (155-160 characters)
- [ ] Full content written in HTML (no markdown)
- [ ] Content includes: problem, solution, and takeaway
- [ ] Headings use `<h3>` and `<h4>` tags
- [ ] Paragraphs are short (2-4 sentences max)
- [ ] Internal links included where relevant
- [ ] Call-to-action at the end (contact, read more, etc.)

### Thumbnail Image
- [ ] Thumbnail created (1200×630px recommended)
- [ ] Image file size < 200KB
- [ ] File format is PNG, JPG, or WebP
- [ ] File saved to `/public/blogs/`
- [ ] Filename matches slug (e.g., `is-your-agency-holding-you-back.png`)
- [ ] Thumbnail is mobile-friendly (readable at small sizes)

### Metadata
- [ ] Unique ID assigned (increment from last blog)
- [ ] Slug is lowercase, hyphens, no spaces
- [ ] Author name filled in (e.g., "TAAM Team" or specific name)
- [ ] Publication date set (YYYY-MM-DD format)
- [ ] Read time estimated correctly (~200 words = 1 min)
- [ ] Category is one of your established categories
- [ ] `published` set to `true` (or `false` for draft)

### Final QA
- [ ] Blog entry added to `siteContent.json`
- [ ] JSON syntax is valid (check for missing commas/brackets)
- [ ] All field values are present
- [ ] Thumbnail path matches actual file
- [ ] Category matches existing categories
- [ ] Date is formatted correctly

---

## Publishing Steps

### Step 1: Prepare Content
- [ ] Write and format blog content
- [ ] Create and optimize thumbnail
- [ ] Gather metadata (author, date, etc.)

### Step 2: Update siteContent.json
- [ ] Open `app/content/siteContent.json`
- [ ] Copy a blog entry as template
- [ ] Update all fields with new content
- [ ] Set `"published": true`

### Step 3: Add Thumbnail
- [ ] Save thumbnail to `/public/blogs/`
- [ ] Match filename to slug

### Step 4: Test Locally
- [ ] Run `npm run dev`
- [ ] Visit `/blog` - see new blog in list
- [ ] Visit `/blog/[slug]` - view full post
- [ ] Check homepage - see featured blog
- [ ] Test on mobile view
- [ ] Click related articles - verify they work

### Step 5: Deploy
- [ ] Commit changes: `git add .`
- [ ] Create descriptive commit message
- [ ] Push to repository
- [ ] Monitor for any build errors

---

## Draft/Scheduling Workflow

### Save as Draft
```json
{
  "published": false
}
```
- Blog won't appear anywhere
- Good for work-in-progress content

### Publish Later
1. Write blog with `"published": false`
2. When ready to go live, change to `"published": true`
3. Push update - blog immediately appears

---

## Maintenance Checklist

### Weekly
- [ ] Monitor blog performance (if you have analytics)
- [ ] Reply to comments/feedback
- [ ] Check for broken links

### Monthly
- [ ] Review underperforming blogs (if data available)
- [ ] Update outdated information
- [ ] Plan next month's blog topics
- [ ] Ensure categories are still relevant

### Quarterly
- [ ] Audit all published blogs
- [ ] Fix any broken links
- [ ] Update old information
- [ ] Review category structure
- [ ] Plan content calendar

---

## Common Issues & Solutions

### Blog Not Appearing on Homepage
- [ ] Check `published: true`
- [ ] Verify blog is in `blogs` array
- [ ] Rebuild site (`npm run build`)
- [ ] Clear browser cache

### Blog Not Accessible at URL
- [ ] Check slug is lowercase, hyphens only
- [ ] Verify `published: true`
- [ ] Confirm blog is in `siteContent.json`
- [ ] Check slug matches URL exactly

### Image Not Loading
- [ ] Verify file exists in `/public/blogs/`
- [ ] Check path in JSON matches filename exactly
- [ ] Ensure correct file extension (`.png`, `.jpg`, etc.)
- [ ] Verify filename in lowercase

### Related Articles Not Showing
- [ ] Check blog has 2+ other published blogs
- [ ] Verify category matches another blog
- [ ] Check that other blogs have `published: true`

### JSON Errors After Adding Blog
- [ ] Check all fields have values
- [ ] Verify commas between entries
- [ ] Ensure closing brackets/braces
- [ ] Use JSON validator if unsure: jsonlint.com

---

## Naming Guidelines

### Good Slugs ✅
```
is-your-agency-holding-you-back
how-to-scale-content-creation
why-brand-strategy-matters
agency-growth-playbook-2026
```

### Bad Slugs ❌
```
is your agency holding you back     (spaces)
Is_Your_Agency_Holding_You_Back    (underscores, caps)
1                                  (not descriptive)
Blog Post About Agencies           (spaces and caps)
```

### Good Filenames ✅
```
is-your-agency-holding-you-back.png
how-to-scale-content.jpg
agency-growth-strategy.webp
```

### Bad Filenames ❌
```
Blog Post 1.png                  (spaces)
BLOG_THUMBNAIL.png               (underscores, all caps)
Screen Shot 2026-08-03 at.png    (system default)
Is_Your_Agency.png               (underscores, caps)
```

---

## Content Quality Checklist

### Headlines
- [ ] Specific, not generic
- [ ] Benefit-driven when possible
- [ ] 60 characters or less
- [ ] No clickbait

### Body Content
- [ ] Opens with a hook or problem
- [ ] Uses clear section headings
- [ ] Short paragraphs (2-4 sentences)
- [ ] Examples or stories included
- [ ] Ends with takeaway or CTA

### Structure
- [ ] H3 tags for main sections
- [ ] Lists used for multiple points
- [ ] Bold/italic for emphasis
- [ ] Proper spacing between sections

### Brand Voice
- [ ] Direct and specific
- [ ] Uses data/proof points
- [ ] Tells real stories
- [ ] Focuses on results
- [ ] Addresses real problems

---

## SEO Optimization Checklist

- [ ] Title is descriptive and specific
- [ ] Slug contains main keyword
- [ ] Excerpt includes value proposition
- [ ] Internal links point to relevant pages
- [ ] External links are relevant and authoritative
- [ ] Category helps with topic clustering
- [ ] Thumbnail has descriptive alt text
- [ ] Read time is accurate

---

## Performance Checklist

- [ ] Thumbnail < 200KB file size
- [ ] Image dimensions 1200×630px
- [ ] JSON is valid (no syntax errors)
- [ ] All fields are populated
- [ ] Category exists across multiple blogs
- [ ] No broken internal links
- [ ] Navigation shows blog link

---

Use this checklist to ensure quality, consistency, and performance across your blog system. Happy blogging! 🚀
