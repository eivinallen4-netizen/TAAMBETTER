export interface ServiceInfo {
  name: string;
  description: string;
}

const DESCRIPTIONS: Record<string, string> = {
  'content strategy': 'We identify your audience, map the conversion path, and build a strategy designed around your specific business goals—not templates.',
  'creation & design': 'High-impact visuals and messaging that command attention. Photography, video, design, and copy that convert.',
  'development': 'The technical infrastructure that makes your content perform. From landing pages to e-commerce to full-stack applications.',
  'campaign execution': 'Strategic planning, creative production, and flawless execution. One unified team, no handoffs, real results.',
  'performance optimization': 'Continuous measurement, data-driven refinement, and accountability. We optimize based on what actually converts, not vanity metrics.',
  branding: 'Identity systems, naming, and guidelines built to survive contact with the real world.',
  'web design': 'Marketing sites and product interfaces designed around what visitors are actually trying to do.',
  'digital development': 'Front-to-back build — from static marketing sites to headless e-commerce and internal tools.',
  'creative strategy': 'Positioning, messaging, and campaign planning that gives every deliverable a reason to exist.',
  'content creation': 'Photography, video, and copy produced on a schedule you can actually plan around.',
};

export function getServiceInfo(name: string): ServiceInfo {
  const description =
    DESCRIPTIONS[name.trim().toLowerCase()] ??
    `Dedicated ${name.toLowerCase()} work, scoped and staffed by the people who deliver it.`;
  return { name, description };
}
