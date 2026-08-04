# TAAM Content Specification

## Home Page (`/`)

### Meta
- **Title**: "TAAM | Branding, Web & Digital Studio"
- **Description**: "Branding, web design, and digital development for companies that need results, not just a deck."

### Sections

#### Hero
- **Type**: Video/Image Hero
- **Title**: "WE DO BIG THINGS"
- **Subtitle**: ""
- **CTA Button**: "SEE THE WORK"
- **Media**: /construction-timelapse.mp4
- **Layout**: Desktop (masked SVG), Mobile (full video overlay)

#### Stats Bar
- Projects delivered: 120+
- Active clients: 45
- Years running: 9
- Industry awards: 14

#### Headline Section
- **Background**: Orange (#F46325)
- **Headline**: "WE ARE TAAM\nWE FINISH\nWHAT WE PITCH"
- **Description**: "One team across five disciplines — branding, web design, development, strategy, and content — so nothing gets lost in a handoff between agencies. If it ships, the same people who pitched it built it."
- **Layout**: 2-column (headline left, description right)

#### Services Section
- **Title**: "WHAT WE DO"
- **Link**: "MORE ABOUT US →" (to /about)
- **Services Grid**: 5 columns (1/sm:2/lg:5)
  1. Branding — [description from content]
  2. Web Design — [description from content]
  3. Digital Development — [description from content]
  4. Creative Strategy — [description from content]
  5. Content Creation — [description from content]

#### Selected Work Grid
- **Title**: "SELECTED WORK"
- **Link**: "ALL PROJECTS →" (to /work)
- **Layout**: 2 large cards (4/3 aspect) + 4 small cards (1/1 aspect)
- **Content**: First 6 published projects from content.projects

#### Process Section
- **Title**: "HOW WE WORK"
- **Background**: Black
- **Steps**: 4 columns (sm:2/lg:4)
  1. Discover — We dig into your business, audience, and competitors before a single pixel moves.
  2. Define — Strategy and scope get locked so everyone agrees on what "done" looks like.
  3. Design & Build — Concepts, iteration, and production happen in tight feedback loops with you.
  4. Launch & Grow — We ship, measure, and keep refining based on real performance data.

#### News Section
- **Title**: "NEWS & UPDATES"
- **Layout**: 2 columns
- **Content**: All news items from content.news array

#### CTA Section
- **Background**: Orange (#F46325)
- **Headline**: "GOT A PROJECT? LET'S TALK"
- **Contact Email**: From content.contact.email
- **CTA Button**: "Get Free Recommendations"

---

## About Page (`/about`)

### Meta
- **Title**: "About TAAM | Branding & Digital Studio"
- **Description**: "4 years, 40+ accounts ran, one studio that still answers its own phone."

### Hero
- **Title**: "ABOUT TAAM"
- **Subtitle**: "4 years, 40+ accounts ran, one studio that still answers its own phone."
- **CTA Button**: "MEET THE TEAM"
- **Media**: No video/image specified

---

## Work Page (`/work`)

### Meta
- **Title**: "Our Work | TAAM Projects & Portfolio"
- **Description**: "Explore our portfolio of branding, web design, and digital development projects."

### Hero
- **Title**: "OUR WORK"
- **Subtitle**: "Six disciplines, one team. Filter by category below."
- **CTA Button**: "VIEW PORTFOLIO"
- **Media**: No video/image specified

### Portfolio Section
- **Filter Bar**: Buttons for all categories + project count
- **Grid Layout**: 2 columns (md:4), auto-rows 220px (md:260px)
- **Content**: All published projects with category filtering
- **Grid Sizing**:
  - Small projects: 1x1 (col-span-1, row-span-1)
  - Wide projects: 2x1 (col-span-2, row-span-1)
  - Tall projects: 1x2 (col-span-1, row-span-2)
  - Large projects: 2x2 (col-span-2, row-span-2)

### CTA Section
- **Headline**: "START YOUR PROJECT"
- **Description**: "Tell us the problem you're trying to solve. We'll tell you straight whether we're the right team to solve it."
- **CTA Button**: "Get Free Recommendations"

---

## Project Detail Page (`/work/:id`)

(Existing implementation maintained)

---

---

## Navigation & Footer

### Navigation
- **Logo**: TAAM white logo
- **Links**: Home, About, Work, Contact
- **Mobile Menu**: Hamburger toggle
- **Scroll Behavior**: Transitions to dark navbar with border when scrolled
- **Utility Bar**: Appears on scroll (desktop only) with email, phone, address

### Footer
- **Logo**: TAAM white logo
- **Company Description**: From content.company.description
- **Sections**:
  - Site: Home, About, Work
  - Services: All services from content.company.services
  - Contact: Email, phone, address, social links (Instagram, Twitter, LinkedIn)
- **Copyright**: © YEAR TAAM. All rights reserved. + Tagline

---

## Global Elements

### Contact Form
- Opens via ContactCTA button
- Modal overlay over page
- Accessible via keyboard

### Color Scheme
- **Primary**: #F46325 (Orange) — accents, CTAs, active states
- **Backgrounds**: #111111 (near-black) and #000000 (black)
- **Text**: #FFFFFF (white) and grayscale (gray-400, gray-500, gray-600)
- **Borders**: Gray-800

### Fonts
- **Primary**: Montserrat (all weights)
- **Fallback**: Sans-serif stack
