import { renderBrandEmail, type BrandEmail } from '@/lib/brand-email';
import type { MessageType } from '@/app/lib/crm-messages';

// The copy for every email the CRM sends. Voice: direct, hungry, no fluff.

export interface MessageInput {
  type: MessageType;
  firstName: string;
  businessName: string;
  link: string;
  /** Zoom: when the call is, as typed ("Tue Oct 21, 2pm PT"). Any link: the button label. */
  when: string;
  /** Any link: what it is ("Your proposal"). Zoom: optional topic. */
  title: string;
  note: string;
}

export function renderCrmEmail(m: MessageInput): { subject: string; html: string; text: string } {
  const heres = m.firstName ? `${m.firstName}, here's` : "Here's";
  const biz = m.businessName || 'your business';
  let subject: string;
  let email: BrandEmail;

  switch (m.type) {
    case 'website_onboarding':
    case 'social_onboarding': {
      const website = m.type === 'website_onboarding';
      subject = website ? 'Welcome to TAAM: your website onboarding' : 'Welcome to TAAM: your social media onboarding';
      email = {
        preheader: `You're in. Here's your private ${website ? 'website' : 'social media'} onboarding link.`,
        eyebrow: website ? 'Website onboarding' : 'Social media onboarding',
        title: m.firstName ? `You're in, ${m.firstName}.` : "You're in.",
        body: website
          ? `Thanks for trusting us with ${biz}. Payment's done, so now we get to work.\n\nThis link is where you give us your current site, logins, domain, what you sell and where your reviews live. It takes a few minutes and saves as you go.`
          : `Thanks for trusting us with ${biz}. Payment's done, so now we get to work.\n\nThis link is where you add your social accounts and logins, what you sell and where your reviews live, so we can start posting. It takes a few minutes and saves as you go.`,
        mascot: 'wave',
        cta: { label: 'Start onboarding', url: m.link },
        note: m.note,
        footer: "This link is private to you. Don't forward it.",
      };
      break;
    }
    case 'zoom':
      subject = m.when ? `Our call: ${m.when}` : `${heres} our Zoom link`;
      email = {
        preheader: m.when ? `We're on for ${m.when}. Link inside.` : 'Your Zoom link is inside.',
        eyebrow: m.title || 'Zoom call',
        title: m.when ? "We're on." : "Let's talk.",
        body: `${heres} the link for our call about ${biz}. Bring your questions. We'll bring the plan.`,
        mascot: 'phone',
        cta: { label: 'Join the call', url: m.link },
        details: [
          ['When', m.when],
          ['Where', 'Zoom (link above)'],
        ],
        note: m.note,
        footer: "You're getting this because you have a call booked with TAAM.",
      };
      break;
    case 'link':
      subject = m.title ? `${m.title} from TAAM` : 'A link from TAAM';
      email = {
        preheader: m.title ? `${m.title} for ${biz}.` : `Something from TAAM for ${biz}.`,
        eyebrow: 'From TAAM',
        title: m.title || 'For you.',
        body: `${heres} what we said we'd send over for ${biz}.`,
        mascot: 'counting',
        cta: { label: m.when || 'Open it', url: m.link },
        note: m.note,
        footer: "You're getting this because you're working with TAAM.",
      };
      break;
  }

  return { subject, ...renderBrandEmail(email) };
}

/** Sent to the client when they hit submit on their onboarding. */
export function renderOnboardingReceivedEmail(firstName: string, businessName: string, website: boolean) {
  return {
    subject: 'Got it. Your TAAM onboarding is in.',
    ...renderBrandEmail({
      preheader: "We have everything we need to get started. Here's what happens next.",
      eyebrow: website ? 'Website onboarding · Received' : 'Social media onboarding · Received',
      title: firstName ? `Got it, ${firstName}.` : 'Got it.',
      mascot: 'wave',
      body: `Your onboarding for ${businessName || 'your business'} is in. We'll go through it, log into everything and reach out if anything's missing.\n\nNext up: we build. You'll hear from us within one business day.`,
      footer: "You're getting this because you just submitted your onboarding.",
    }),
  };
}
