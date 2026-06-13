/**
 * syncFamilyMemberToSheets — TEMPORARILY DISABLED
 *
 * TODO: Replace this later with Supabase Edge Function + Google Sheets API.
 * Migration plan:
 *   1. Create a Supabase Edge Function that accepts member data in the request body.
 *   2. Store Google OAuth credentials / service account in Supabase secrets.
 *   3. Call the Google Sheets API directly to append rows (no Base44 connector).
 *
 * The original Base44 implementation is preserved below (commented out) for reference.
 */

// TODO: Remove Base44 SDK once Supabase Edge Function is live.
// import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (_req) => {
  return Response.json({
    success: true,
    disabled: true,
    message:
      'syncFamilyMemberToSheets is temporarily disabled. ' +
      'Pending migration to Supabase Edge Function + Google Sheets API.',
  });
});

/*
// ── Original Base44 implementation (disabled) ──────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { member } = await req.json();

    if (!member) {
      return Response.json({ error: 'No member data provided' }, { status: 400 });
    }

    // TODO: Replace with Google OAuth token from Supabase secrets
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    const spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
    if (!spreadsheetId) {
      return Response.json(
        { error: 'GOOGLE_SHEETS_SPREADSHEET_ID not configured' },
        { status: 400 }
      );
    }

    const rowData = [
      member.full_name || '',
      member.gender || '',
      member.date_of_birth || '',
      member.current_location || '',
      member.email || '',
      member.mobile_number || '',
      member.occupation || '',
      new Date().toISOString(),
    ];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:H:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowData],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: `Google Sheets API error: ${error}` }, { status: 500 });
    }

    const result = await response.json();
    return Response.json({ success: true, updates: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

*/
