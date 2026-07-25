import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const LEADS_FILE = join(process.cwd(), 'app', 'content', 'leads.json');

interface Lead {
  id: string;
  timestamp: string;
  [key: string]: unknown;
}

async function readLeads(): Promise<Lead[]> {
  try {
    const data = await readFile(LEADS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function GET() {
  const leads = await readLeads();
  const sorted = [...leads].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return Response.json(sorted);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (typeof id !== 'string') {
    return Response.json({ error: 'Missing id' }, { status: 400 });
  }
  const leads = await readLeads();
  const filtered = leads.filter((lead) => lead.id !== id);
  await writeFile(LEADS_FILE, JSON.stringify(filtered, null, 2));
  return Response.json({ success: true });
}
