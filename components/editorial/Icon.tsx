// Geometric line icons (generated with Codex; sources in public/icons/*.svg).
const paths = {
  strategy: (
    <>
      <circle cx="24" cy="24" r="13" />
      <path d="M24 4V15M24 33V44M4 24H15M33 24H44" />
    </>
  ),
  creation: (
    <>
      <circle cx="24" cy="24" r="16" />
      <path d="M24 17L30.06 20.5M24 17L14.21 11.35M30.06 20.5L30.06 27.5M30.06 20.5L30.06 9.19M30.06 27.5L24 31M30.06 27.5L39.85 21.85M24 31L17.94 27.5M24 31L33.79 36.65M17.94 27.5L17.94 20.5M17.94 27.5L17.94 38.81M17.94 20.5L24 17M17.94 20.5L8.15 26.15" />
    </>
  ),
  development: (
    <>
      <rect x="6" y="8" width="36" height="32" />
      <path d="M17 18L11 24L17 30M31 18L37 24L31 30M27 16L21 32" />
    </>
  ),
  campaign: <path d="M24 10H8V40H38V24M22 26L40 8M29 8H40V19" />,
  optimization: <path d="M7 41H41M10 39V30H16V39M22 39V24H28V39M34 39V18H40V39M9 23L22 15L38 7M30 7H38V15" />,
  find: (
    <>
      <circle cx="21" cy="21" r="13" />
      <path d="M31 31L41 41" />
    </>
  ),
  plan: (
    <>
      <rect x="7" y="7" width="34" height="34" />
      <path d="M24 7V41M7 24H41M8 16L16 8M8 23L23 8M15 24L24 15" />
    </>
  ),
  make: (
    <>
      <rect x="7" y="7" width="34" height="34" rx="5" />
      <path d="M20 16L32 24L20 32Z" />
    </>
  ),
  prove: (
    <>
      <circle cx="22" cy="26" r="15" />
      <path d="M14 26L20 32L30 22M39 18V5M34 10L39 5L44 10" />
    </>
  ),
} as const;

export type IconName = keyof typeof paths;

export const serviceIconNames: Record<string, IconName> = {
  'content strategy': 'strategy',
  'creation & design': 'creation',
  development: 'development',
  'campaign execution': 'campaign',
  'performance optimization': 'optimization',
};

export const processIconNames: IconName[] = ['find', 'plan', 'make', 'prove'];

export default function Icon({ name, className = 'w-10 h-10' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
