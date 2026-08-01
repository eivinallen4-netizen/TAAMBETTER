# Parallax & Smooth Animation System

## Overview
Comprehensive parallax scrolling and smooth animation system built with Framer Motion (motion library).

## New Motion Components

### Core Components
1. **ParallaxLayer** - Creates parallax depth effects with configurable speed
2. **ScrollReveal** - Reveals elements with directional animations (up, down, left, right)
3. **ScrollProgress** - Gradient progress bar showing scroll position
4. **StaggerContainer** - Container for staggered child animations
5. **FloatingElement** - Continuous floating animation
6. **CountUp** - Animates numbers counting up on scroll
7. **GlitchText** - Staggered letter reveal animation
8. **ScaleReveal** - Scale and opacity reveal animations
9. **SmoothScroll** - Smooth scroll-based opacity and movement

### Animation Patterns
- **ScrollReveal**: Fade + directional movement on scroll
- **ParallaxLayer**: Different scroll speeds for depth perception
- **StaggerContainer**: Multiple items animate in sequence
- **Smooth animations**: Duration 0.5-0.8s with easeOut timing

## Implementation Details

### Scroll-Based Variants
- `staggerContainerScroll` - Container with stagger transition
- `staggerItemScroll` - Child items fade and slide in
- `slideInLeftScroll` - Slides in from left on scroll
- `slideInRightScroll` - Slides in from right on scroll

### Parallax Speeds
- Slow (0.3-0.4): Background elements, subtle effect
- Medium (0.4-0.5): Mid-layer elements
- Fast (0.1-0.3): Foreground elements, less movement

## Updated Sections

### Hero Section
- Video background moves at 0.5 speed
- Gradient overlay at 0.3 speed
- Creates depth perception as user scrolls

### HomeHeadlineSection
- Pattern background parallax
- Glow elements at different speeds
- Smooth slide-in animations

### ServicesSection
- Scroll reveal title
- Staggered service cards with scroll animations
- Each card animates in sequence

### StatsBarSection
- Parallax video background
- Staggered stat animations
- Hover scale effects

### HomeWorkGridSection
- Parallax background elements
- Scroll reveal title
- Staggered grid animations

### NewsSection
- Parallax background orb
- Scroll reveal heading
- Staggered news items

### CTASection
- Parallax background elements
- Scroll-based slide-in animations
- Creates visual momentum

## Features

✓ Smooth parallax scrolling throughout entire page
✓ Scroll progress indicator at top
✓ Staggered animations for multiple elements
✓ Different parallax speeds for depth
✓ Directional reveal animations
✓ Hover effects on interactive elements
✓ Performance optimized with viewport detection
✓ Works seamlessly with Next.js 16 & React 19

## Viewport Settings
- Animations trigger at 20-30% viewport visibility
- `once: false` allows repeating animations on scroll up/down
- Smooth easing curves for natural motion

## Usage Example

```tsx
import { ScrollReveal, ParallaxLayer } from '@/components/motion';

export function MyComponent() {
  return (
    <section>
      <ParallaxLayer speed={0.4}>
        <div>Background Element</div>
      </ParallaxLayer>
      
      <ScrollReveal direction="up" delay={0.1}>
        <h2>Title</h2>
      </ScrollReveal>
    </section>
  );
}
```

## Performance Notes
- Parallax effects use `useScroll` and `useTransform` for optimal performance
- No heavy DOM manipulation
- Viewport detection prevents unnecessary animations
- Smooth 60fps animations with proper timing

## Browser Support
- Chrome/Edge 88+
- Firefox 87+
- Safari 14.1+
- All modern browsers with CSS transform support
