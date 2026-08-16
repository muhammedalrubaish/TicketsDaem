import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasServiceAccountKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    serviceAccountKeyLength: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? process.env.GOOGLE_SERVICE_ACCOUNT_KEY.length : 0,
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN,
  });
}
