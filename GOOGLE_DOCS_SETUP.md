# Google Docs Integration Setup

This guide walks you through setting up Google Docs as your blog content source.

## Prerequisites

You need a **Service Account** (not OAuth2 credentials). If you only have OAuth credentials, create a service account:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **Service Accounts** (under APIs & Services)
4. Click **Create Service Account**
5. Give it a name like "Blog Content Reader"
6. Grant it **Editor** role (or just **Reader** for Docs API)
7. Create a **JSON key** and download it

## Environment Variables

Add these to your `.env.local` file:

```bash
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=123456789
```

You'll find all these values in your service account JSON file.

⚠️ **Important**: The `GOOGLE_PRIVATE_KEY` needs newlines escaped as `\n`. If you download the JSON, you can extract it directly—just make sure it's a single line in `.env.local`.

## Sharing Google Docs

Share each blog Google Doc with your service account email:
- Right-click the doc → Share
- Add your service account email (`GOOGLE_CLIENT_EMAIL`)
- Give it **Viewer** access

## Adding Blogs

Update `app/content/siteContent.json` to add `googleDocId`:

```json
{
  "id": 1,
  "slug": "my-blog-post",
  "title": "My Blog Post",
  "excerpt": "...",
  "googleDocId": "1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
  "thumbnail": "/blogs/thumbnail.png",
  "author": "TAAM Team",
  "date": "2026-08-03",
  "readTime": "5 min read",
  "category": "Strategy",
  "published": true
}
```

The `description` field is no longer needed—content comes from Google Docs.

## How It Works

- Content is fetched on-demand when someone visits the blog
- Results are cached for 1 hour to avoid Google API rate limits
- Headers (H1-H6) automatically become orange (#F46325)
- Text is white/gray to match your site
- All formatting (bold, italic, links) is preserved
