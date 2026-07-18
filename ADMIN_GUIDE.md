# TAAM Content Management Guide

## Quick Start

Your site now has an **admin dashboard** where you can manage all content without touching code. It is not behind any login — anyone with the URL can view and edit it.

### Access the Admin Dashboard
Go to: **http://localhost:3000/admin**

---

## Dashboard Sections

### 1. **MESSAGING** Tab
Edit company-wide content:
- **Company Name** — Your agency name (default: "TAAM")
- **Tagline** — Short company tagline
- **Description** — Full company description
- **Services** — List your services (comma-separated)
- **Homepage Headline** — Main headline on home page
- **Homepage Description** — Subtitle/description on home page

### 2. **HERO** Tab
Customize hero sections for each page:
- **Home Page**
  - Title
  - Subtitle
  - Button Text
  - Video URL (e.g., `/construction-timelapse.mp4`)
- **About Page**
  - Title, Subtitle, Button Text
- **Work Page**
  - Title, Subtitle, Button Text

### 3. **PROJECTS** Tab
Manage your portfolio:
- **Add Projects** — Click "+ ADD PROJECT" to add new projects
- **Edit Project Info:**
  - Title
  - Category (e.g., "Branding", "Web Design")
  - Image URL (paste link to your image)
  - Color (red, cyan, yellow, purple, green, orange, blue, pink)
  - Size (small or large — controls grid layout)
  - Description
  - Challenge / Solution / Results / Technologies

### 4. **TEAM** Tab
Add your team members:
- Click "+ ADD TEAM MEMBER"
- Add:
  - Name
  - Role
  - Image URL
  - Bio

### 5. **NEWS** Tab
Manage news/blog posts:
- Click "+ ADD NEWS"
- Add:
  - Title
  - Description
  - Date
  - Link URL

### 6. **CONTACT** Tab
Update your contact info:
- Email (used in "GET IN TOUCH" buttons)
- Phone
- Address
- Social media links (Instagram, Twitter, LinkedIn)

---

## How to Add Projects

1. Go to **ADMIN > PROJECTS**
2. Click **+ ADD PROJECT**
3. Fill in the fields:
   - **Title**: "Design Refresh for Tech Startup"
   - **Category**: "Branding"
   - **Image URL**: Upload to a CDN (Imgur, Cloudinary, etc.) and paste URL here
   - **Color**: Pick a color for the grid tile
   - **Size**: "large" or "small" (affects grid layout)
   - **Description**: Full project description
   - **Challenge**: The problem you solved
   - **Solution**: How you solved it
   - **Results**: What happened after
   - **Technologies**: Tools you used
4. Click **SAVE CHANGES**

---

## How to Add Images

Since this is a static site, you need to host images externally:

### Option 1: Free Image Hosting
- Upload to **Imgur.com** or **Cloudinary** (free tier)
- Copy the image URL
- Paste into the admin dashboard

### Option 2: GitHub
- Push images to `/public` folder
- Reference as `/your-image.jpg` in the dashboard

### Option 3: Store Locally
- Add images to `public/` folder
- Reference as `/your-image.jpg`

---

## Saving Changes

1. Make edits in any admin tab
2. Click **SAVE CHANGES** (orange button at bottom)
3. See the green checkmark when saved
4. Click **VIEW SITE** to preview changes

---

## Default Content Structure

All content is stored in: `app/content/siteContent.json`

The admin dashboard updates this file when you save. The pages automatically read from this file.

---

## Tips

✅ **Do this:**
- Add real project names (not "Project 01")
- Add real team member names
- Add actual descriptions
- Use high-quality images

❌ **Avoid this:**
- Placeholder text that looks generic
- Fake dates for news
- Low-resolution images
- Vague project descriptions

---

## Next Steps

1. **Add Your Projects** (3-6 best projects)
2. **Add Your Team** (if applicable)
3. **Update Company Info** (mission, tagline, services)
4. **Add Contact Details** (email, phone, social)
5. **Replace Hero Video** (or remove the `/public/construction-timelapse.mp4`)

---

## Color Reference for Projects

- **red** — Red gradient
- **cyan** — Cyan/blue gradient
- **yellow** — Yellow gradient
- **purple** — Purple gradient
- **green** — Green gradient
- **orange** — Orange gradient
- **blue** — Blue gradient
- **pink** — Pink gradient

---

## Questions?

The admin dashboard is fully self-explanatory. Just:
1. Go to `/admin`
2. Click a tab
3. Edit the fields
4. Click "SAVE CHANGES"

All changes update live on the website.
