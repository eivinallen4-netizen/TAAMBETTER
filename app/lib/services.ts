export interface ServiceInfo {
  name: string;
  description: string;
}

const DESCRIPTIONS: Record<string, string> = {
  'content strategy': 'Who needs to see you, where they are, and what makes them stop. Built around the goals you set, not a template.',
  'creation & design': 'Video, photo, design and copy made to make people say WOW. Your work and your people, shown the way they deserve.',
  'development': 'Websites and landing pages that turn all that attention into calls, bookings and sales.',
  'campaign execution': 'We plan it, shoot it, edit it and post it. One team doing the work, so nothing waits on a handoff.',
  'performance optimization': 'We watch what brings in customers, do more of it and cut what doesn\'t. Then we prove it again next month.',
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
