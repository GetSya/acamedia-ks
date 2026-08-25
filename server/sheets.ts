import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const getAuthToken = () => {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error('Missing Google Service Account credentials');
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });
};

const sheets = google.sheets({ version: 'v4', auth: getAuthToken() });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

export const getSheetData = async (range: string) => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return response.data.values || [];
};

export const appendSheetData = async (range: string, values: any[][]) => {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
};

export const updateSheetData = async (range: string, values: any[][]) => {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
};

export const deleteSheetRow = async (sheetName: string, rowIndex: number) => {
  // To delete a row, we need the sheetId. 
  // For simplicity in this demo, we might just clear the row or use batchUpdate if we had the sheetId.
  // Let's assume we can clear the range.
  const range = `${sheetName}!A${rowIndex + 1}:Z${rowIndex + 1}`;
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
};

export const getRowsAsObjects = async (sheetName: string) => {
  const data = await getSheetData(`${sheetName}!A:Z`);
  if (data.length === 0) return [];
  // Use trimmed lowercase headers to make property access case-insensitive
  const headers = data[0].map((h: any) => h.toString().trim().toLowerCase());
  const rows = data.slice(1);
  return rows.map((row, index) => {
    const obj: any = { _rowIndex: index + 1 }; // 1-based index (header is 0, first data row is 1)
    headers.forEach((header, i) => {
      // Trim values to avoid issues with accidental spaces in sheets
      obj[header] = (row[i] || '').toString().trim();
    });
    return obj;
  });
};
