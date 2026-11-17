import { crm } from '@/crm';

// Site reviews (lib/crm-site/reviews), shown inside the CRM's menu and behind its sign-in
// screen. Owner and admins: the operations check that; the page also says so to anyone else.
export const dynamic = 'force-dynamic';

export default crm.AdminFrame;
