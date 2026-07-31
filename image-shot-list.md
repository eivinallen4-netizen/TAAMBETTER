# Image Shot List

All image slots are labeled for client production guidance.

## Homepage

### Hero Section
- **Slot**: Hero video/image background
- **Format**: MP4 video or JPG image
- **Dimensions**: 1461×822px (16:9 aspect)
- **Purpose**: Construction timelapse or agency action footage
- **Current Asset**: `/construction-timelapse.mp4`
- **Status**: Configured via content

### Project Cards (Selected Work)
- **Large cards (2)**: 4:3 aspect ratio
- **Small cards (4)**: 1:1 square aspect ratio
- **Format**: JPG/PNG with solid background or product shot
- **Purpose**: Featured project showcase
- **Slot Count**: 6 total project images
- **Status**: Loaded from `content.projects[].image`

---

## About Page

### Hero Section
- **Slot**: Hero video/image background
- **Format**: MP4 video or JPG image
- **Dimensions**: 1461×822px (16:9 aspect)
- **Purpose**: About page hero (currently empty in content)
- **Current Asset**: None (falls back to solid background)

### Team Section
- **Card Format**: 1:1 square aspect ratio
- **Count**: 4+ team member photos
- **Format**: JPG/PNG portrait or headshot
- **Purpose**: Team member profiles
- **Slot Count**: Configurable in `content.team[].image`
- **Placeholder**: "placeholder-person.jpg" fallback

---

## Work Portfolio Page

### Hero Section
- **Slot**: Hero video/image background
- **Format**: MP4 video or JPG image
- **Dimensions**: 1461×822px (16:9 aspect)
- **Purpose**: Work portfolio page hero (currently empty in content)
- **Current Asset**: None (falls back to solid background)

### Portfolio Grid
- **Format**: Flexible grid with:
  - Small (1×1) square cards
  - Wide (2×1) landscape cards
  - Tall (1×2) portrait cards
  - Large (2×2) big feature cards
- **Aspect Ratios**: Varies by card size
- **Count**: All published projects from content
- **Format**: JPG/PNG with semi-transparent overlay
- **Purpose**: Project portfolio showcase

---

## Global Components

### Navigation Logo
- **Asset**: `/brand-assets/logos/transparent/TAAM_logo_white_transparent.png`
- **Size**: 32×32px to 40×40px display
- **Purpose**: Navigation bar header
- **Status**: Configured

### Footer Logo
- **Asset**: `/brand-assets/logos/transparent/TAAM_logo_white_transparent.png`
- **Size**: 32×32px display
- **Purpose**: Footer branding
- **Status**: Configured

---

## Image Optimization Notes

- **Format**: JPG for photos, PNG for graphics
- **Compression**: Optimize for web (60-75% quality for JPG)
- **Dimensions**: Match aspect ratios exactly; use responsive images
- **Delivery**: Use Next.js Image component (already wrapped in project cards)
- **Lazy Loading**: Enabled for off-screen images
- **Accessibility**: All images have alt text from content
