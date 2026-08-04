# 📱 Blog System Visual Guide

This guide shows what your blog looks like across different pages and devices.

## Homepage "Insights & Ideas" Section

Located between "News" section and final CTA.

### Desktop View
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Insights & Ideas                                   │
│  Stories, strategies, and lessons learned from      │
│  growing real businesses.                           │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Blog 1   │  │ Blog 2   │  │ Blog 3   │          │
│  │          │  │          │  │          │          │
│  │[Thumbnail]  │[Thumbnail]  │[Thumbnail]         │
│  │          │  │          │  │          │          │
│  │ Strategy │  │ Tips     │  │ Strategy │          │
│  │ Blog Title  │ Blog Title  │ Blog Title         │
│  │          │  │          │  │          │          │
│  │ Excerpt  │  │ Excerpt  │  │ Excerpt  │          │
│  │ 2026-... │  │ 2026-... │  │ 2026-... │          │
│  │ 5 min    │  │ 7 min    │  │ 5 min    │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│                [View All Articles]                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Mobile View
```
┌─────────────────┐
│ Insights & Ideas│
│ Stories and...  │
│                 │
│ ┌─────────────┐ │
│ │[Thumbnail]  │ │
│ │ Strategy    │ │
│ │ Blog Title  │ │
│ │ Excerpt...  │ │
│ │ 2026- 5 min │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │[Thumbnail]  │ │
│ │ Tips        │ │
│ │ Blog Title  │ │
│ │ Excerpt...  │ │
│ │ 2026- 7 min │ │
│ └─────────────┘ │
│                 │
│ [View All...]   │
│                 │
└─────────────────┘
```

---

## Blog Listing Page (`/blog`)

### Page Header
```
┌──────────────────────────────────┐
│ INSIGHTS & IDEAS                 │
│                                  │
│ Stories, strategies, and lessons │
│ learned from growing real        │
│ businesses. Get the insights     │
│ that actually move the needle.   │
│                                  │
│ [All] [Strategy] [Tips] [News]   │
│ ← 3 articles                     │
└──────────────────────────────────┘
```

### Blog List Item (Desktop)
```
┌─────────────────────────────────────────────────┐
│ [Thumbnail] │ Strategy  │ 2026-08-03  │ 5 min   │
│             │                                     │
│             │ Is Your Agency Holding You Back?    │
│             │                                     │
│             │ Most agencies work in isolation...  │
│             │                                     │
│             │ READ ARTICLE → ────────────────── │
│             │                                     │
└─────────────────────────────────────────────────┘
```

### Blog List Item (Mobile)
```
┌─────────────────────┐
│ [Thumbnail Image]   │
│                     │
│ Strategy  2026-...  │
│ 5 min read          │
│                     │
│ Is Your Agency      │
│ Holding You Back?   │
│                     │
│ Most agencies work  │
│ in isolation...     │
│                     │
│ READ ARTICLE → ──── │
└─────────────────────┘
```

---

## Individual Blog Post (`/blog/[slug]`)

### Article Header
```
┌──────────────────────────────────┐
│ ← Back to articles               │
│                                  │
│ Strategy  │ 2026-08-03  │ 5 min  │
│ By TAAM Team                     │
│                                  │
│ Is Your Agency Holding You Back? │
│                                  │
│ Most agencies work in isolation. │
│ They hand off work and disappear.│
│ We work differently — as an      │
│ integrated partner committed to  │
│ your growth.                     │
└──────────────────────────────────┘
```

### Featured Image
```
┌──────────────────────────────┐
│                              │
│     [Thumbnail Image]        │
│     (Large featured image)   │
│                              │
│     Blog cover/thumbnail     │
│     displayed full width     │
│                              │
└──────────────────────────────┘
```

### Article Content
```
┌──────────────────────────────┐
│ The Challenge                │
│                              │
│ When you hire an agency, ... │
│                              │
│ Most agencies fall short. ... │
│                              │
│ The Handoff Problem          │
│                              │
│ You get a strategy from ...  │
│                              │
│ [Multiple sections with      │
│  formatted HTML content]     │
│                              │
└──────────────────────────────┘
```

### Author Bio Section
```
┌──────────────────────────────┐
│ [Avatar] TAAM Team           │
│          Marketing expert    │
│          at TAAM             │
│                              │
│ Short bio about the author   │
│                              │
└──────────────────────────────┘
```

### Related Articles Section
```
┌──────────────────────────────┐
│ More Articles                │
│                              │
│ ┌──────────┐  ┌──────────┐  │
│ │[Thumbnail] │[Thumbnail]  │
│ │          │  │          │  │
│ │ Strategy │  │ Strategy │  │
│ │ Title    │  │ Title    │  │
│ │ Excerpt  │  │ Excerpt  │  │
│ │ READ→    │  │ READ→    │  │
│ └──────────┘  └──────────┘  │
│                              │
└──────────────────────────────┘
```

---

## Navigation

### Desktop Navigation Bar
```
┌─────────────────────────────────────────────┐
│ [TAAM Logo] Home  About  Work  Blog  Contact│
│                                   [See Work]│
└─────────────────────────────────────────────┘
```

### Mobile Navigation (Open)
```
┌──────────────────┐
│ ✕                │
│                  │
│ HOME             │
│ ABOUT            │
│ WORK             │
│ BLOG             │ ← NEW
│ CONTACT          │
│                  │
│ ──────────────── │
│ contact@taam...  │
│ 702-997-6813     │
│ LAS VEGAS, NV    │
│                  │
│ [Social Icons]   │
└──────────────────┘
```

---

## Color & Design

### Blog Cards
- **Background**: Dark gray (#1f2937)
- **Border**: Gray-700, hover changes to orange (#F46325)
- **Category Badge**: Orange text on dark background
- **Title**: White, turns orange on hover
- **Text**: Gray-400 (lighter gray)

### Interactive Elements
- **Hover State**: Border turns orange, slight zoom on image
- **Animations**: Smooth transitions on all hover states
- **Responsive**: Cards stack on mobile, grid on desktop

### Typography
- **Headlines**: Large, bold, black font-family
- **Body**: Regular weight, good line height for reading
- **Meta (date/category)**: Small, gray, uppercase for category

---

## Blog Entry in Homepage Blog Section

### What Shows
- ✅ Thumbnail image
- ✅ Category badge
- ✅ Title
- ✅ Excerpt (first 2-3 sentences)
- ✅ Publication date
- ✅ Read time estimate

### What Doesn't Show (full content)
- ❌ Full blog body
- ❌ Author bio
- ❌ Related articles
- ❌ Comments

---

## Blog Entry on Blog Listing Page

### What Shows
- ✅ Thumbnail image (smaller)
- ✅ Category badge
- ✅ Title
- ✅ Excerpt
- ✅ Publication date
- ✅ Read time estimate
- ✅ Hover "READ ARTICLE →" text

### What Doesn't Show (until you click)
- ❌ Full blog body
- ❌ Author bio
- ❌ Related articles

---

## Blog Post Full Page

### What Shows
- ✅ All above
- ✅ Large featured thumbnail
- ✅ Full blog content (HTML formatted)
- ✅ Author bio with avatar
- ✅ Related articles (2)
- ✅ "Back to articles" link

### CTA Section
- Shows after all blog content
- Standard TAAM call-to-action
- "READY TO GROW?" section
- Prompts visitor to get in touch

---

## Responsive Breakpoints

### Mobile (< 768px)
- Single column layout
- Thumbnail on top, content below
- Larger touch targets
- Simplified navigation
- Full-width images

### Tablet (768px - 1024px)
- 2-column grid for blog lists
- Balanced spacing
- Readable text sizes

### Desktop (> 1024px)
- 3-column grid for homepage featured blogs
- Multi-column list layout on blog page
- Full hover animations
- Optimal line lengths for readability

---

## Current First Blog

**Title:** Is Your Agency Holding You Back?
**Status:** Ready to go live (just needs thumbnail image)
**Location:** `/blog/is-your-agency-holding-you-back`
**Category:** Strategy
**Read Time:** 5 min read
**Content:** ~900 words covering:
- The Challenge (handoff problem)
- The Vanishing Act
- The Growth Plateau
- What Actually Works
- Takeaway with CTA

---

## Quick Visual Summary

| Location | Display | Items | Features |
|----------|---------|-------|----------|
| Homepage | Cards | 3 | Image, title, excerpt, category |
| /blog | List | All | Thumbnail, title, excerpt, date, filtering |
| /blog/[slug] | Post | 1 | Full content, related posts, author bio |
| Nav | Link | 1 | Desktop + mobile menu |

---

**All styling uses TAAM's brand colors and design system. Responsive design ensures beautiful display on all devices.**
