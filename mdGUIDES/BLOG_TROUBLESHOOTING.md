# 🔧 Blog System Troubleshooting Guide

Quick solutions for common issues when managing your blog.

## Problem: Blog Not Showing on Homepage

### Symptoms
- Homepage has no "Insights & Ideas" section
- Blog cards don't appear between News and CTA sections

### Solutions

**Check 1: Blog is Published**
```json
// ✅ CORRECT
{
  "published": true
}

// ❌ WRONG
{
  "published": false
}
```

**Check 2: Blog Exists in siteContent.json**
- Open `app/content/siteContent.json`
- Look for `"blogs": [` array
- Verify your blog is inside this array
- Check JSON is valid (no missing commas)

**Check 3: At Least One Blog Published**
- Need at least 1 blog with `published: true`
- HomepageSection shows up to 3 blogs
- If less than 1, section won't render

**Check 4: Clear Cache & Rebuild**
```bash
npm run build
# Then test locally with:
npm run dev
```

**Check 5: Browser Cache**
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cookies if persists

---

## Problem: Blog Not Accessible at URL

### Symptoms
- `/blog` works but individual blog 404s
- URL `/blog/is-your-agency-holding-you-back` shows page not found

### Solutions

**Check 1: Blog Slug Matches URL**
- URL is `/blog/is-your-agency-holding-you-back`
- JSON slug field should be: `"slug": "is-your-agency-holding-you-back"`
- Must match exactly (case-sensitive)

**Check 2: Blog is Published**
```json
"published": true  // ✅ Required
```

**Check 3: Blog is in siteContent.json**
- Blog must exist in `app/content/siteContent.json`
- Must be in `"blogs": []` array

**Check 4: Slug Format**
- ✅ Only lowercase letters
- ✅ Only hyphens (no underscores, spaces)
- ✅ No special characters
- ❌ NO UPPERCASE LETTERS
- ❌ NO SPACES
- ❌ NO UNDERSCORES

**Good slugs:**
```
is-your-agency-holding-you-back
how-to-scale-content
why-brand-strategy-matters
```

**Bad slugs:**
```
Is-Your-Agency (has capitals)
is_your_agency (has underscores)
is your agency (has spaces)
```

**Check 5: Rebuild Site**
```bash
npm run build
npm run dev
```

---

## Problem: Blog Thumbnail Not Loading

### Symptoms
- Blog appears but image shows as broken
- Alt text or placeholder appears instead of image

### Solutions

**Check 1: File Exists**
- Navigate to: `public/blogs/`
- Verify your image file is actually there
- File extension should be visible (`.png`, `.jpg`, etc.)

**Check 2: Path Matches Exactly**
```json
// In siteContent.json:
"thumbnail": "/blogs/is-your-agency-holding-you-back.png"

// File location:
public/blogs/is-your-agency-holding-you-back.png
```
- These must match exactly
- Include the `.png` extension
- Forward slashes (not backslashes)

**Check 3: File Extension Correct**
- ✅ PNG: `file.png`
- ✅ JPG: `file.jpg`
- ✅ WebP: `file.webp`
- ❌ Don't mix or omit extension

**Check 4: Filename Lowercase**
```
✅ is-your-agency-holding-you-back.png
❌ Is-Your-Agency-Holding-You-Back.png
❌ IS-YOUR-AGENCY-HOLDING-YOU-BACK.PNG
```
- Filenames are case-sensitive on servers
- Always use lowercase

**Check 5: File Size**
- Keep images under 200KB
- Compress images: TinyPNG.com or similar
- Large files slow down page load

**Check 6: Correct Directory**
```
✅ public/blogs/image.png
❌ app/public/blogs/image.png
❌ public/images/image.png
❌ public/Blogs/image.png (capital B)
```

---

## Problem: JSON Errors in siteContent.json

### Symptoms
- Build fails with JSON error
- Blog doesn't show, console shows error
- Error message mentions "parsing" or "JSON"

### Solutions

**Check 1: Missing Commas**
```json
✅ CORRECT
{
  "id": 1,
  "title": "Blog"
}

❌ WRONG - Missing comma after id
{
  "id": 1
  "title": "Blog"
}
```

**Check 2: Missing Closing Brackets**
```json
✅ CORRECT
{
  "blogs": [
    { "id": 1 }
  ]
}

❌ WRONG - Missing closing bracket
{
  "blogs": [
    { "id": 1 }
}
```

**Check 3: Quotes Around Values**
```json
✅ CORRECT
{
  "title": "My Blog"
}

❌ WRONG
{
  title: "My Blog"
}
```

**Check 4: Using JSONLint**
1. Visit: https://jsonlint.com
2. Paste entire siteContent.json
3. Click "Validate JSON"
4. It will show exact line with error

**Check 5: Extra Trailing Comma**
```json
✅ CORRECT
{
  "blogs": [
    { "id": 1 }
  ]
}

❌ WRONG - Extra comma after last item
{
  "blogs": [
    { "id": 1, }
  ]
}
```

---

## Problem: Blog Shows But Styling Looks Wrong

### Symptoms
- Blog appears but formatting is broken
- Text not styled correctly
- HTML tags showing as text

### Solutions

**Check 1: HTML Format**
- Description field should contain HTML
- ❌ Don't use Markdown
- ✅ Use proper HTML tags

```json
❌ WRONG (Markdown)
"description": "# Title\nParagraph text"

✅ CORRECT (HTML)
"description": "<h3>Title</h3><p>Paragraph text</p>"
```

**Check 2: Proper HTML Tags**
```json
✅ CORRECT
"description": "<h3>Section</h3><p>Text</p>"

❌ WRONG
"description": "## Section\nText"
```

**Check 3: Closing Tags**
```json
✅ CORRECT
"<p>Paragraph</p>"

❌ WRONG
"<p>Paragraph"
```

**Check 4: Common Tags**
```html
<h3>Heading</h3>        <!-- Section title -->
<p>Paragraph</p>        <!-- Text block -->
<strong>Bold</strong>   <!-- Bold text -->
<em>Italic</em>         <!-- Italic text -->
<ul>
  <li>Bullet</li>
  <li>Bullet</li>
</ul>                   <!-- Bullet list -->
<ol>
  <li>Item 1</li>
  <li>Item 2</li>
</ol>                   <!-- Numbered list -->
<a href="url">Link</a>  <!-- Link -->
```

---

## Problem: "Related Articles" Not Showing

### Symptoms
- Blog post loads but "More Articles" section is missing
- No related posts appear at bottom

### Solutions

**Check 1: Multiple Published Blogs**
- Need at least 2 blogs total (so 1 can show as related)
- Both must have `"published": true`
- Check siteContent.json `"blogs"` array

**Check 2: Category Matches**
- Blog has category: `"category": "Strategy"`
- Another blog needs same category
- Related articles filtered by matching category

```json
// Both should have matching category:
"category": "Strategy"
```

**Check 3: Blogs Are Published**
```json
✅ CORRECT
{
  "id": 1,
  "title": "Blog 1",
  "category": "Strategy",
  "published": true
},
{
  "id": 2,
  "title": "Blog 2",
  "category": "Strategy",
  "published": true
}

❌ WRONG - Second blog not published
{
  "id": 2,
  "published": false
}
```

**Check 4: Rebuild Site**
```bash
npm run build
npm run dev
```

---

## Problem: Category Filter Not Working on /blog

### Symptoms
- Filter buttons don't appear
- Clicking categories does nothing
- "All" filter shows nothing

### Solutions

**Check 1: Published Blogs Exist**
- At least 1 blog must be published
- Must have `"published": true`

**Check 2: Categories Assigned**
- Each blog needs a `"category"` field
- All categories shown as filter buttons

```json
✅ CORRECT
{
  "id": 1,
  "category": "Strategy"
},
{
  "id": 2,
  "category": "Tips"
}
```

**Check 3: Rebuild Site**
```bash
npm run build
npm run dev
```

---

## Problem: Build Fails with TypeScript Error

### Symptoms
- `npm run build` fails
- Error message mentions "could not find module"
- References to missing components

### Solutions

**Check 1: Component Imports**
- Verify all components exist:
  - `/components/ui/Container.tsx` ✅
  - `/components/ui/Badge.tsx` ✅
  - `/components/ui/Title.tsx` ✅
  - `/components/sections/CTASection.tsx` ✅
  - `/components/sections/BlogSection.tsx` ✅ (newly created)

**Check 2: Import Paths**
```tsx
// ✅ CORRECT
import Container from '@/components/ui/Container';
import BlogSection from '@/components/sections/BlogSection';

// ❌ WRONG
import Container from '../components/ui/Container';
import BlogSection from '../BlogSection';
```

**Check 3: Reinstall Dependencies**
```bash
npm install
# or if using yarn:
yarn install
```

**Check 4: Clear Build Cache**
```bash
rm -rf .next
npm run build
```

---

## Problem: Blog Works Locally But Not After Deploy

### Symptoms
- Blog appears in `npm run dev` but not on deployed site
- 404 errors after pushing to production

### Solutions

**Check 1: Build Success**
- Verify `npm run build` completes without errors
- Check for "Build successful" message

**Check 2: All Files Committed**
```bash
git status
# Should show no uncommitted changes related to blog
```

**Check 3: Check Deployment Logs**
- Review deploy logs for build errors
- Look for JSON parsing errors
- Check for missing file errors

**Check 4: Clear Deployment Cache**
- Redeploy entire project
- Clear cache in deployment settings
- Force rebuild from source

---

## Quick Debug Checklist

When something doesn't work, check in this order:

- [ ] Is blog `published: true`?
- [ ] Does thumbnail file exist in `/public/blogs/`?
- [ ] Does slug match URL exactly (lowercase)?
- [ ] Is JSON valid (use jsonlint.com)?
- [ ] Are all required fields filled?
- [ ] Did you rebuild with `npm run build`?
- [ ] Did you clear browser cache (Ctrl+Shift+R)?
- [ ] Are file extensions correct (`.png`, `.jpg`)?
- [ ] Are all commas in place in JSON?
- [ ] Are image paths correct (/blogs/... not /blog/...)?

---

## Getting More Help

1. **Verify JSON**: https://jsonlint.com
2. **Check Image Hosting**: Verify file exists with `npm run dev` and checking Network tab
3. **Review Files**: Double-check file names and paths
4. **Check Examples**: Review first blog entry in siteContent.json
5. **Read Documentation**: BLOG_SETUP.md has detailed explanations

---

**Most issues come down to: typos in filenames, missing files, or JSON syntax errors. Check those first!**
