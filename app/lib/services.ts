export interface ServiceInfo {
  name: string;
  description: string;
}

const DESCRIPTIONS: Record<string, string> = {
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
