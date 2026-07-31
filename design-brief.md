# TAAM Design Brief

## Color Palette

### Semantic Roles
- **Primary (Action)**: `--taam-orange` (#F46325) — high-contrast CTA, accent text, hover states
- **Surface (Dark)**: `--taam-near-black` (#111111) — primary background, section containers
- **Surface (Darkest)**: Black (#000000) — footer, borders, process section
- **Background (Light)**: `--taam-light-gray` (#F2F2F2) — available but not currently used
- **Text (Primary)**: `--taam-white` (#FFFFFF) — body text, headings
- **Border/Dividers**: Gray-800 hierarchy — subtle section separations

### Tint Palette (Orange variations)
- Tint 2: #FF7B42 (lighter hover state)
- Tint 3: #FF9A66 (secondary accent)
- Tint 4: #FFB38C (tertiary)
- Tint 5: #FFD5C2 (lightest)

## Typography

- **Font Family**: Montserrat (via Google Fonts)
- **Font-sans**: Montserrat stack fallback
- **Weights in use**:
  - **Black (900)**: Page titles, large headings, bold statements
  - **Bold (700)**: Section headings, card titles, labels
  - **Semibold (600)**: Navigation links, CTAs, UI text
  - **Regular (400)**: Body copy, descriptions, helper text

## Spacing & Layout

- **Container**: max-w-7xl (grid breakpoints: 1280px)
- **Horizontal padding**: px-4 (nav), px-6 (sections)
- **Vertical rhythm**: py-14 to py-16 for major sections
- **Grid gaps**: gap-4 (compact), gap-6 (breathing), gap-8 (spacious)
- **Radius language**: rounded-lg throughout (no border-radius specification; uses Tailwind default)
- **Shadow language**: Gradient overlays instead of drop shadows; hover:shadow-2xl on portfolio cards

## Layout Patterns

### Hero Section
- **Desktop**: 80vh min 560px, max 760px — masked SVG video with gradient overlay, content bottom-left
- **Mobile**: 70vh min 480px — full video with black overlay (40%), centered text
- **Gradient overlay**: `from-[#111111] via-[#5c2110]/85 to-transparent` (dark fade)

### Section Shell
- Dark background (near-black or black)
- max-w-7xl container with mx-auto
- Bordered dividers (border-gray-800)
- Top/bottom padding py-14 to py-16

### Grid Layouts
- Services: 1 col (sm: 2), lg: 5 with 1px gap, hover:bg-gray-900
- Homepage work grid: 2 cols (md: 2 + 4) with gap-4
- Portfolio grid: 2 cols (md: 4) with 220px rows (260px on md+)
- Process: 1 col (sm: 2), lg: 4 with gap-8

### Card Patterns
- **Work cards**: Border-2 border-gray-700, hover:border-[#F46325], gradient bg, relative image with overlay
- **Service cards**: border-b or no border, hover:bg-gray-900, pt-4
- **News cards**: border-b border-gray-800, hover:border-[#F46325]

## Imagery & Visual Style

- **Hero**: SVG mask + video background (construction timelapse default)
- **Project cards**: Absolute positioned images with aspect-ratio containers
- **Overlays**: Gradient fades, semi-transparent black (#000000/10 to /40)
- **Icons**: Arrow unicode (↗), chevrons, inline SVG for nav menu

## Components in Use

- **Hero**: Title + subtitle + CTA button, both desktop (masked) and mobile (overlay)
- **Navigation**: Fixed top, responsive logo, desktop nav links + mobile hamburger, scrolls into dark navbar
- **StatsBar**: Compact stat block (value + label)
- **ContactCTA**: Button component that opens contact modal
- **Footer**: 4-column grid, logo + company desc, site links, services, contact + social
- **Section**: Generic container with max-w and padding
- **Grid**: Multi-column layouts with gap controls

## Interaction Language

- **Hover states**: Border color change (gray-700 → orange), text color shift, bg-gray-900 lift
- **Transitions**: `transition-all`, `duration-300`, `transition-colors`, `duration-300`
- **Focus/Active**: Underlines (nav), border colors (primary), outline rings on keyboard focus
- **Loading**: N/A (static site)
- **Modals**: Contact form opens from buttons

## Mood & Voice

- **Professional yet bold**: Strong typography, high contrast
- **Results-driven**: Copy emphasizes shipping and delivery
- **Minimal but impactful**: Dark, clean, orange accent cuts through
- **Technical credibility**: Code-like organization, clear hierarchy

## Typography Scale

- **Display**: text-5xl to text-6xl (h1, page titles)
- **Large heading**: text-4xl (section titles)
- **Heading**: text-3xl (section titles, secondary)
- **Subheading**: text-xl to text-2xl (card titles)
- **Body**: text-base to text-lg (main copy)
- **Label**: text-sm to text-xs (CTAs, badges, UI text)
