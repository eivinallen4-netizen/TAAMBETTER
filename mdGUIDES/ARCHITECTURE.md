# TAAM Website Architecture

## Overview

This is a Next.js 16 + Tailwind CSS v4 marketing site built with a component-first, content-driven architecture. The design ensures:

- **Single source of truth**: All content via `siteContent.json`
- **Primitive-first components**: Semantic UI building blocks (Button, Card, Title, Text, etc.)
- **Reusable sections**: Complex layouts composed from primitives
- **Clean theme tokens**: Orange + near-black palette with Montserrat typography

---

## Directory Structure

```
.
├── app/
│   ├── layout.tsx           # Root layout + Navigation + Footer
│   ├── globals.css          # Tailwind + theme tokens
│   ├── page.tsx             # Homepage
│   ├── about/page.tsx       # About page
│   ├── work/page.tsx        # Work portfolio page
│   ├── work/[id]/page.tsx   # Project detail page
│   ├── admin/page.tsx       # Admin dashboard (leads upload)
│   ├── api/                 # API endpoints (contact, content, leads)
│   ├── components/          # Legacy components (to refactor)
│   │   ├── Hero.tsx
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   ├── ContactCTA.tsx
│   │   └── ContactForm/
│   ├── content/             # JSON data
│   │   └── siteContent.json
│   └── lib/                 # Utilities
│       └── services.ts
├── components/              # NEW: Primitive components + sections
│   ├── ui/                  # Primitive components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Container.tsx
│   │   ├── Section.tsx
│   │   ├── Title.tsx
│   │   ├── Heading.tsx
│   │   ├── Text.tsx
│   │   └── Badge.tsx
│   └── sections/            # Reusable section layouts
│       ├── HomeHeadlineSection.tsx
│       ├── ServicesSection.tsx
│       ├── HomeWorkGridSection.tsx
│       ├── ProcessSection.tsx
│       ├── NewsSection.tsx
│       ├── StatsBarSection.tsx
│       └── CTASection.tsx
├── design-brief.md          # Design system documentation
├── content-spec.md          # Content strategy & sitemap
├── image-shot-list.md       # Image asset requirements
├── ARCHITECTURE.md          # This file
└── package.json
```

---

## Component Philosophy

### Primitives (UI Components)

Located in `components/ui/`, these are low-level building blocks:

- **Button**: Variant system (primary, dark, outline), sizes, arrow icon
- **Card**: Clickable container with optional image overlay
- **Container**: Max-width wrapper (max-w-7xl mx-auto px-6)
- **Section**: Full-width section with background variants
- **Title**: Large heading (h1/h2/h3) with color control
- **Heading**: Medium heading (h2/h3/h4/h5) with color control
- **Text**: Flexible text component (size + color + semantic tag)
- **Badge**: Label with semantic styling

**Rule**: No text content appears raw in pages. Always use `<Title>`, `<Heading>`, `<Text>`, or `<Button>`.

### Sections (Layout Components)

Located in `components/sections/`, these compose primitives into reusable layouts:

- **HomeHeadlineSection**: Orange background, 2-col grid (headline + description)
- **ServicesSection**: 5-column service card grid
- **HomeWorkGridSection**: 2 large + 4 small project cards
- **ProcessSection**: 4-step process grid with borders
- **NewsSection**: 2-column news list
- **StatsBarSection**: 4-column stat block
- **CTASection**: Call-to-action bar (2 variants: default + work)

**Rule**: Sections only import primitives. No raw HTML elements.

### Legacy Components

Kept in `app/components/` for backward compatibility:

- **Hero**: Video/image hero with SVG mask (desktop) or overlay (mobile)
- **Navigation**: Fixed nav with scroll-triggered dark mode
- **Footer**: 4-column footer with links + contact
- **ContactCTA**: Button that opens modal form
- **ContactForm**: Modal form component + provider

These can be refactored into the new structure but are functional as-is.

---

## Content Architecture

### Single Source of Truth: `siteContent.json`

All copy, CTAs, projects, team members, and structured data live in one file:

```json
{
  "company": {
    "name": "TAAM",
    "tagline": "The agency that ships what it pitches",
    "services": ["Branding", "Web Design", ...]
  },
  "hero": {
    "home": { "title": "WE DO BIG THINGS", ... },
    "about": { "title": "ABOUT TAAM", ... },
    "work": { "title": "OUR WORK", ... }
  },
  "projects": [
    { "id": 1, "title": "...", "published": true, ... }
  ],
  "news": [ { "id": 1, "title": "...", "date": "...", ... } ],
  "team": [ { "id": 1, "name": "...", "image": "...", ... } ],
  "process": [ { "step": "01", "title": "Discover", ... } ],
  "contact": { "email": "...", "phone": "...", ... }
}
```

**Pattern**: All pages import siteContent and pass data to components via props.

---

## Theme Tokens

Defined in `globals.css`:

```css
:root {
  /* Brand Colors */
  --taam-orange: #F46325;
  --taam-near-black: #111111;
  --taam-white: #FFFFFF;
  
  /* Semantic Tokens */
  --color-primary: var(--taam-orange);
  --color-surface: var(--taam-near-black);
  --color-text-primary: var(--taam-white);
}

@theme inline {
  --color-taam-orange: var(--taam-orange);
  --color-primary: var(--color-primary);
  /* ... exposed to Tailwind */
}
```

**Usage**: All colors via Tailwind classes (`bg-taam-orange`, `text-taam-white`) or CSS variables in components.

---

## Data Flow

1. **Content** → `siteContent.json`
2. **Page** → Imports siteContent + passes data to sections
3. **Section** → Composes primitives, passes data down
4. **Primitive** → Renders with styling applied

Example:

```tsx
// app/page.tsx
import siteContent from './content/siteContent.json';
import HomeHeadlineSection from '@/components/sections/HomeHeadlineSection';

export default function Home() {
  return (
    <HomeHeadlineSection
      headline={siteContent.homepage.headline}
      description={siteContent.homepage.description}
    />
  );
}

// components/sections/HomeHeadlineSection.tsx
import Title from '../ui/Title';
import Text from '../ui/Text';

export default function HomeHeadlineSection({ headline, description }) {
  return (
    <section className="bg-[#F46325]">
      <div className="max-w-7xl mx-auto px-6 py-14 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <Title as="h1" color="white" className="whitespace-pre-line">
            {headline}
          </Title>
          <Text size="lg" color="white" className="opacity-90">
            {description}
          </Text>
        </div>
      </div>
    </section>
  );
}
```

---

## Routing

- **`/`**: Homepage (hero + stats + services + work grid + process + news + CTA)
- **`/about`**: About page (hero + stats + tagline + team + services + CTA)
- **`/work`**: Portfolio (hero + filterable grid + CTA)
- **`/work/:id`**: Project detail (existing, uses project data from content)
- **`/admin`**: Admin dashboard (upload leads CSV)
- **`/api/contact`**: POST endpoint for contact form
- **`/api/leads`**: POST endpoint for lead imports
- **`/api/content`**: GET endpoint for content JSON

---

## Styling Rules

### Tailwind Classes Only

No CSS files in components. All styling via Tailwind + inline className.

### Color Usage

**Preferred** (theme-aware):
```tsx
className="bg-taam-orange text-white border-gray-800"
```

**Acceptable** (semantic colors):
```tsx
className="bg-[#F46325]" // Only for brand colors already in @theme
```

**Avoid** (arbitrary values):
```tsx
className="bg-[#abc123]" // Random color not in theme
```

### Text Elements

Always use primitives:

```tsx
// ✓ Good
<Title as="h1">Headline</Title>
<Heading as="h2">Subheading</Heading>
<Text size="base">Body copy</Text>
<Badge>Label</Badge>

// ✗ Avoid
<h1>Headline</h1>
<h2>Subheading</h2>
<p>Body copy</p>
<span>Label</span>
```

### Layout

Container wrapper handles max-width + padding:

```tsx
// ✓ Good
<Container>
  <Title>Content</Title>
</Container>

// ✗ Avoid
<div className="max-w-7xl mx-auto px-6">
  <h1>Content</h1>
</div>
```

---

## Build & Deployment

### Development

```bash
npm run dev
# Opens http://localhost:3000
```

### Production Build

```bash
npm run build
npm run start
```

### Deployment

Configured for Vercel (Next.js native). Push to main branch for auto-deploy.

---

## Extensibility

### Adding a New Page

1. Create `app/newpage/page.tsx`
2. Add content to `siteContent.json`
3. Import section components
4. Compose page from sections

### Adding a New Section

1. Create `components/sections/NewSection.tsx`
2. Import primitives (Title, Text, Card, etc.)
3. Compose layout
4. Export and use in pages

### Updating Theme

1. Edit `globals.css` `:root` variables
2. Update `@theme inline` to expose to Tailwind
3. Update `design-brief.md` if palette changes

---

## Maintenance Checklist

- [ ] Content updates go to `siteContent.json` only
- [ ] New UI elements use `components/ui/` primitives
- [ ] New layouts use `components/sections/` composition
- [ ] No hardcoded colors outside `@theme`
- [ ] No raw `<h1>`, `<p>`, `<button>` in pages/sections
- [ ] Images added to `image-shot-list.md`
- [ ] Run hygiene-check before commit: `node scripts/hygiene-check.mjs`
- [ ] Type check passes: `npm run build`
