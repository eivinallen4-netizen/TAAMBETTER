import { google } from 'googleapis';

const CACHE = new Map<string, { content: string; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

interface GoogleDocsContent {
  title: string;
  html: string;
}

async function createAuthClient() {
  const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  };

  return google.auth.getClient({
    credentials: credentials as any,
    scopes: ['https://www.googleapis.com/auth/documents.readonly'],
  });
}

function transformGoogleDocsToHTML(doc: any): string {
  const elements = doc.body?.content || [];
  let html = '';

  elements.forEach((element: any) => {
    if (element.paragraph) {
      const paragraph = element.paragraph;
      let paragraphHTML = '';
      const isHeading = paragraph.paragraphStyle?.headingId;

      if (isHeading) {
        const headingLevel = paragraph.paragraphStyle.headingId.replace('h', '');
        const tagName = `h${headingLevel}`;
        paragraphHTML = `<${tagName} class="font-bold text-[#F46325] mb-4">`;
      } else {
        // Get default font size from paragraph style
        const fontSize = paragraph.paragraphStyle?.defaultHeaderId
          ? undefined
          : paragraph.paragraphStyle?.fontSize?.value;
        const fontSizeStyle = fontSize ? `font-size: ${fontSize}pt;` : '';
        paragraphHTML = `<p${fontSizeStyle ? ` style="${fontSizeStyle}"` : ''}>`;
      }

      paragraph.elements?.forEach((el: any) => {
        const text = el.textRun?.content || '';
        const style = el.textRun?.textStyle || {};

        let styledText = text;
        const fontSize = style.fontSize?.value;
        const fontSizeStyle = fontSize ? `font-size: ${fontSize}pt;` : '';

        if (fontSizeStyle) {
          styledText = `<span style="${fontSizeStyle}">${styledText}</span>`;
        }

        if (style.bold) styledText = `<strong>${styledText}</strong>`;
        if (style.italic) styledText = `<em>${styledText}</em>`;
        if (style.underline) styledText = `<u>${styledText}</u>`;

        paragraphHTML += styledText;
      });

      if (isHeading) {
        const headingLevel = paragraph.paragraphStyle.headingId.replace('h', '');
        const tagName = `h${headingLevel}`;
        paragraphHTML += `</${tagName}>`;
      } else {
        paragraphHTML += '</p>';
      }

      html += paragraphHTML;
    } else if (element.table) {
      html += transformTable(element.table);
    } else if (element.bulleted) {
      // Handle bullet lists
      const listItem = element.bullet;
      let listHTML = '<li>';
      listItem.listItems?.forEach((item: any) => {
        item.paragraph?.elements?.forEach((el: any) => {
          listHTML += el.textRun?.content || '';
        });
      });
      listHTML += '</li>';
      html += listHTML;
    }
  });

  return html;
}

function transformTable(table: any): string {
  let html = '<table class="w-full border-collapse border border-gray-700 mb-4">';

  table.tableRows?.forEach((row: any) => {
    html += '<tr>';
    row.tableCells?.forEach((cell: any) => {
      html += '<td class="border border-gray-700 p-3">';
      cell.content?.forEach((content: any) => {
        if (content.paragraph) {
          content.paragraph.elements?.forEach((el: any) => {
            html += el.textRun?.content || '';
          });
        }
      });
      html += '</td>';
    });
    html += '</tr>';
  });

  html += '</table>';
  return html;
}

export async function fetchGoogleDoc(docId: string): Promise<GoogleDocsContent> {
  // Check cache first
  const cached = CACHE.get(docId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[Google Docs] Returning cached content for ${docId}`);
    return JSON.parse(cached.content);
  }

  try {
    if (!process.env.GOOGLE_CLIENT_EMAIL) {
      throw new Error('Missing GOOGLE_CLIENT_EMAIL environment variable');
    }

    const auth = await createAuthClient();
    const docs = google.docs({ version: 'v1', auth });

    console.log(`[Google Docs] Fetching document ${docId}...`);
    const response = await docs.documents.get({
      documentId: docId,
    });

    const doc = response.data;
    const html = transformGoogleDocsToHTML(doc);
    const title = doc.title || 'Untitled';

    const result = { title, html };

    // Cache the result
    CACHE.set(docId, {
      content: JSON.stringify(result),
      timestamp: Date.now(),
    });

    console.log(`[Google Docs] Successfully fetched and cached ${docId}`);
    return result;
  } catch (error) {
    console.error(`[Google Docs] Error fetching document ${docId}:`, error);
    throw new Error(`Failed to fetch Google Doc: ${docId}`);
  }
}

export function clearDocCache(docId: string) {
  CACHE.delete(docId);
}

export function clearAllCache() {
  CACHE.clear();
}
