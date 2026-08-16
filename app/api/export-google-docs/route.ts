import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Trigger rebuild to apply updated Vercel environment variables.
// Expected env variables:
// GOOGLE_SERVICE_ACCOUNT_KEY - base64‑encoded JSON key for a service account with Drive & Docs scopes
// Alternatively, set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN for OAuth2.

const SCOPES = ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive.file'];

/**
 * Initialize Google Auth client.
 * Prefer a service account for simplicity; fall back to OAuth2 if env vars are set.
 */
function getAuthClient() {
  // Try OAuth2 first (uses user's personal drive quota)
  let { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN) {
    GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID.trim();
    GOOGLE_CLIENT_SECRET = GOOGLE_CLIENT_SECRET.trim();
    GOOGLE_REFRESH_TOKEN = GOOGLE_REFRESH_TOKEN.trim();
    const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
    return oauth2;
  }
  // Fallback to Service Account
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const key = JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8'));
      return new google.auth.GoogleAuth({
        credentials: key,
        scopes: SCOPES,
      });
    } catch (e) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', e);
    }
  }
  throw new Error('Google credentials not configured or invalid');
}

export async function POST(req: Request) {
  try {
    const { tickets } = await req.json();
    if (!Array.isArray(tickets)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const auth = await getAuthClient();
    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    // 1️⃣ Create a blank Google Doc
    const createRes = await docs.documents.create({
      requestBody: {
        title: 'تقارير البلاغات',
      },
    });
    const documentId = createRes.data.documentId;
    if (!documentId) throw new Error('Failed to create document');

    // 2️⃣ Build table rows (header + data)
    const header = ['رقم البلاغ', 'اسم المستقبل', 'الحالة / الحلول المقترحة', 'تاريخ استقبال البلاغ'];
    const rows = tickets.map((t: any) => [
      t.number ?? t.id?.toString() ?? '',
      t.receiver ?? '',
      t.solution ?? '',
      t.date ?? '',
    ]);

    const totalRows = rows.length + 1; // +1 for header
    const totalCols = header.length;

    // First insert the empty table structure
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertTable: {
              rows: totalRows,
              columns: totalCols,
              location: { index: 1 },
            },
          },
        ],
      },
    });

    // Fetch the document body to find the exact paragraph start index for each cell
    const docData = await docs.documents.get({ documentId });
    const content = docData.data.body?.content || [];
    let tableElement: any = null;
    for (const element of content) {
      if (element.table) {
        tableElement = element.table;
        break;
      }
    }

    if (!tableElement) throw new Error('Failed to locate table in document');

    const insertions: { text: string; index: number }[] = [];

    // Map header cells to their paragraph start indices
    const headerRow = tableElement.tableRows[0];
    header.forEach((text, col) => {
      const cell = headerRow.tableCells[col];
      const startIndex = cell.content[0]?.paragraph?.startIndex;
      if (typeof startIndex === 'number') {
        insertions.push({ text, index: startIndex });
      }
    });

    // Map data rows to their paragraph start indices
    rows.forEach((row, rowIndex) => {
      const docRow = tableElement.tableRows[rowIndex + 1];
      row.forEach((text, colIndex) => {
        const cell = docRow.tableCells[colIndex];
        const startIndex = cell.content[0]?.paragraph?.startIndex;
        if (typeof startIndex === 'number') {
          insertions.push({ text, index: startIndex });
        }
      });
    });

    // Sort insertions descending by index so that inserting text doesn't shift indices for subsequent insertions
    insertions.sort((a, b) => b.index - a.index);

    const textRequests = insertions.map((ins) => ({
      insertText: {
        text: ins.text,
        location: { index: ins.index },
      },
    }));

    if (textRequests.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: textRequests },
      });
    }

    // 3️⃣ Get shareable link (drive.permissions.create + export URL)
    await drive.permissions.create({
      fileId: documentId,
      requestBody: {
        role: 'writer',
        type: 'anyone',
      },
    });
    const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    return NextResponse.json({ url: docUrl });
  } catch (error: any) {
    console.error('Export error', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
