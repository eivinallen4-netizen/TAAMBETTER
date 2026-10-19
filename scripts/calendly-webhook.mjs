#!/usr/bin/env node
// Registers the Calendly webhook that tells the CRM when a prospect books or cancels from an
// appointment link. Run once (and again if the site URL or signing key changes):
//
//   node scripts/calendly-webhook.mjs            # registers ${NEXT_PUBLIC_SITE_URL}/api/calendly/webhook
//   node scripts/calendly-webhook.mjs --list     # shows existing webhooks
//   node scripts/calendly-webhook.mjs --url https://example.ngrok.app/api/calendly/webhook
//
// Reads CALENDLY_TOKEN, CALENDLY_WEBHOOK_SIGNING_KEY and NEXT_PUBLIC_SITE_URL from .env.
// Webhooks need Calendly Standard or higher.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const line of fs.existsSync(path.join(root, '.env')) ? fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/) : []) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const token = process.env.CALENDLY_TOKEN;
const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
if (!token) throw new Error('Set CALENDLY_TOKEN in .env first');

const args = process.argv.slice(2);
const urlArg = args.includes('--url') ? args[args.indexOf('--url') + 1] : '';
const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://taammarketing.com').replace(/\/$/, '');
const target = urlArg || `${site}/api/calendly/webhook`;

async function api(pathOrUrl, init = {}) {
  const res = await fetch(pathOrUrl.startsWith('https://') ? pathOrUrl : `https://api.calendly.com${pathOrUrl}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Calendly ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

const me = (await api('/users/me')).resource;
const organization = me.current_organization;
console.log(`Calendly account: ${me.name} <${me.email}>`);

const existing = (await api(`/webhook_subscriptions?organization=${encodeURIComponent(organization)}&scope=organization&count=100`)).collection;

if (args.includes('--list')) {
  for (const w of existing) console.log(`${w.state.padEnd(8)} ${w.callback_url}  [${w.events.join(', ')}]`);
  if (!existing.length) console.log('No webhooks yet.');
  process.exit(0);
}

if (!signingKey) throw new Error('Set CALENDLY_WEBHOOK_SIGNING_KEY in .env first (any long random string)');

// Re-registering replaces the old one, so a new signing key takes effect.
for (const w of existing.filter((w) => w.callback_url === target)) {
  await api(w.uri, { method: 'DELETE' }).catch(() => {});
  console.log(`Removed old webhook for ${target}`);
}

const created = (
  await api('/webhook_subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      url: target,
      events: ['invitee.created', 'invitee.canceled'],
      organization,
      scope: 'organization',
      signing_key: signingKey,
    }),
  })
).resource;

console.log(`Webhook ${created.state}: ${created.callback_url}`);
console.log('Bookings from appointment links will now show their call time in the CRM.');
