---
name: TAAM Free Video Offer Page
description: Key context for the free-video-offer conversion page — form flow, branding, and known issues fixed
type: project
---

The free-video-offer page is TAAM's primary conversion page for a short-form video giveaway offer targeting Las Vegas businesses, particularly real estate professionals.

**Why:** It is the main landing page linked from event promotions and the FreeVideoPromoBanner component on the main site.

**How to apply:** When making changes to this page, prioritize conversion-focused design. The form is the hero — everything else supports it. Keep sections tight and non-redundant.

Key facts established during the August 2026 polish pass:
- Brand color is `#F46325` (taam-orange). Always use inline `style={{ color/background: '#F46325' }}` for CTAs to guarantee rendering — Tailwind's `bg-taam-orange` works but explicit inline is safer for critical buttons.
- Form scroll is handled via a `useRef` on the form card (`formRef`) and a `scrollToForm()` helper — all CTA buttons call this. The old code had a broken `document.querySelector('[style*="box-shadow"]')` pattern that never worked.
- Validation uses inline error states (red text under each field), not `alert()`. Errors clear as the user types.
- The success state is permanent (does not auto-reset with a timeout). Shows "You're on the list." with a 24-hour follow-up expectation.
- Platform checkboxes use `rounded-md` indicator (square); radio-style single-select options use `rounded-full` (circle). Handled via `radioIndicatorClass(selected, shape)` helper.
- Mobile sticky CTA uses a dark frosted-glass bar (`rgba(0,0,0,0.95)` + `backdropFilter: blur(12px)`) rather than a solid orange bar.
- Backup email form on the orange section submits to console for now — needs real email integration.
- `focus:bg-white/8` Tailwind class may not resolve in Tailwind v4 — inputs also get `focus:border-taam-orange/60` for visible focus ring via border.
