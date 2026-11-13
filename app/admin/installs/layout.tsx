import { crm } from '@/crm';

// Client installs (lib/crm-site/installs), shown inside the CRM's menu and behind its sign-in
// screen. Owner only: the operations check that; the page also says so to anyone else.
export const dynamic = 'force-dynamic';

export default crm.AdminFrame;
