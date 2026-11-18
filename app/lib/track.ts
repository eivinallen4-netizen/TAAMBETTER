// One place every funnel event goes through. Today it reaches Google Analytics (gtag, loaded in the
// root layout). There is no Meta Pixel or Conversions API on the site yet: when one is added, fire
// fbq('track' | 'trackCustom', name, data, { eventID: data.event_id }) here and send the same
// event_id server-side so Meta dedupes. /score sends ViewContent, QuizStart, Lead and QualifiedLead.

type EventData = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const META_STANDARD = new Set(['ViewContent', 'Lead']);

export function trackEvent(name: string, data: EventData = {}): void {
  if (typeof window === 'undefined') return;
  try {
    window.gtag?.('event', name, data);
    if (window.fbq) {
      const { event_id, ...rest } = data;
      window.fbq(META_STANDARD.has(name) ? 'track' : 'trackCustom', name, rest, event_id ? { eventID: String(event_id) } : undefined);
    }
  } catch {
    // Tracking never breaks the page.
  }
}
