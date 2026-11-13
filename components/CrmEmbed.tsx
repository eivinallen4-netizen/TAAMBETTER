import '@taam/crm/styles.css';
import type { CSSProperties, ReactNode } from 'react';
import { crm } from '@/crm';

// Every CRM page (staff screens under /admin and the customer pages) sits inside this. The
// website keeps its own <html>, fonts and analytics; the CRM reuses the Montserrat the site
// already loads instead of fetching it again.
const FONT = { '--crm-font': "var(--font-montserrat), 'Montserrat', ui-sans-serif, system-ui, sans-serif" } as CSSProperties;

export default function CrmEmbed({ children }: { children: ReactNode }) {
  return <crm.EmbedRoot style={FONT}>{children}</crm.EmbedRoot>;
}
