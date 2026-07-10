import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

const CONTENT_FILE = join(process.cwd(), 'app', 'content', 'siteContent.json');

export async function GET() {
  try {
    const data = await readFile(CONTENT_FILE, 'utf-8');
    return Response.json(JSON.parse(data));
  } catch (error) {
    return Response.json({ error: 'Failed to read content' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const content = await request.json();
    await writeFile(CONTENT_FILE, JSON.stringify(content, null, 2));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Failed to save content' }, { status: 500 });
  }
}
