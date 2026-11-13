import { forwardToCrm, legacyRestPath } from '@/lib/crm-route';

// The REST API at its original address. It is the CRM's API (also at /api/crm/v1); the spec is
// at /api/v1/openapi.json. Auth: Authorization: Bearer taam_… (make keys at /admin/api-keys).
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const { GET, POST, PATCH, PUT, DELETE } = forwardToCrm((params) => ['v1', ...legacyRestPath((params.path as string[]) ?? [])]);
