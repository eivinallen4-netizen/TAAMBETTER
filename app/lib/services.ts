export interface ServiceInfo {
  name: string;
  description: string;
}

const DESCRIPTIONS: Record<string, string> = {
  'content marketing': 'Full-funnel content strategies that position you as the authority in your industry. From planning to production to performance tracking—we build content engines that attract, engage, and convert your ideal customers.',
  branding: 'Identity systems and messaging that stop people in their tracks and make them remember you.',
  'web design': 'Sites built around what your customers actually need—designed to convert, not just to look good.',
  'digital development': 'Front-to-back build—from marketing sites that sell to headless platforms that scale.',
  'creative strategy': 'The foundation of everything. We lock in positioning and messaging so every dollar you spend matters.',
  'content creation': 'Stories, video, and copy that prove your expertise and earn customer trust. Produced on a schedule that fits your business.',
};

export function getServiceInfo(name: string): ServiceInfo {
  const description =
    DESCRIPTIONS[name.trim().toLowerCase()] ??
    `Dedicated ${name.toLowerCase()} work, scoped and staffed by the people who deliver it.`;
  return { name, description };
}
