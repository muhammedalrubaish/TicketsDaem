import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1z9AEnkj2G9I2FRo0IPUlLHQQ-IazzhLMYWefEZQUV3I';
const TARGET_GID = '1355865368';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getAuthClient() {
  // 1. Try Service Account first (recommended and already shared with the sheet)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const key = JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8'));
      return new google.auth.JWT({
        email: key.client_email,
        key: key.private_key,
        scopes: SCOPES
      });
    } catch (e) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', e);
    }
  }

  // 2. Fallback to OAuth2
  let { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN) {
    const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID.trim(), GOOGLE_CLIENT_SECRET.trim());
    oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN.trim() });
    return oauth2;
  }
  throw new Error('Google credentials not configured or invalid');
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Get spreadsheet metadata to locate the sheet name matching target gid
    const doc = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheet = doc.data.sheets?.find(s => s.properties?.sheetId?.toString() === TARGET_GID);
    const sheetName = sheet?.properties?.title || 'Sheet1';

    // 2. Append row to sheet: Columns: اسم الموظف، اسم المستفيد، رقم الهوية، رقم الجوال، نوع الخدمة، التاريخ
    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:F`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            data.employeeName || '',
            data.beneficiaryName || '',
            data.nationalId || '',
            data.phoneNumber || '',
            data.serviceType || '',
            data.date || ''
          ]
        ]
      }
    });

    return NextResponse.json({ success: true, updatedCells: appendRes.data.updates?.updatedCells });
  } catch (error: any) {
    console.error('Register Visitor Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
