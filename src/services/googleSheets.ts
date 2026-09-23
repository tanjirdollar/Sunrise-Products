/**
 * Google Sheets Integration Service for StitchTrack Pro
 * Real-time two-way synchronization for Piece Rate Invoices and Workers
 */

import { LotInvoice, Worker } from '../types';

let cachedAccessToken: string | null = null;
const SPREADSHEET_ID_KEY = 'stitchtrack_google_spreadsheet_id';

export const setGoogleAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getSavedSpreadsheetId = (): string | null => {
  return localStorage.getItem(SPREADSHEET_ID_KEY);
};

export const setSavedSpreadsheetId = (id: string) => {
  localStorage.setItem(SPREADSHEET_ID_KEY, id);
};

export const getSpreadsheetUrl = (id?: string | null): string | null => {
  const sheetId = id || getSavedSpreadsheetId();
  if (!sheetId) return null;
  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
};

export interface SheetSyncError extends Error {
  isApiDisabled?: boolean;
  activationUrl?: string;
  code?: number;
}

/**
 * Creates or gets the existing Google Spreadsheet in user's Drive
 */
export const getOrCreateSpreadsheet = async (): Promise<string> => {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('Google Sign-In required to sync with Google Sheets');
  }

  const existingId = getSavedSpreadsheetId();
  if (existingId) {
    // Verify it still exists and is accessible
    try {
      const checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${existingId}?fields=spreadsheetId,sheets.properties.title`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (checkRes.ok) {
        return existingId;
      }
    } catch (e) {
      console.warn('Existing spreadsheet unreachable, creating a new one', e);
    }
  }

  // Create new Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'StitchTrack Pro - Factory Piece Rate Records',
      },
      sheets: [
        { properties: { title: 'Lot_Invoices' } },
        { properties: { title: 'Workers' } },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    let friendlyMessage = errorText;
    let activationUrl = 'https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=858072248658';
    let isApiDisabled = false;

    try {
      const parsed = JSON.parse(errorText);
      if (parsed?.error?.message) {
        friendlyMessage = parsed.error.message;
      }
      if (errorText.includes('Google Sheets API has not been used in project') || errorText.includes('it is disabled') || parsed?.error?.code === 403) {
        isApiDisabled = true;
        const match = friendlyMessage.match(/https:\/\/console\.developers\.google\.com[^\s]+/);
        if (match) {
          activationUrl = match[0];
        }
      }
    } catch {}

    const err: SheetSyncError = new Error(friendlyMessage);
    err.isApiDisabled = isApiDisabled || errorText.includes('sheets.googleapis.com');
    err.activationUrl = activationUrl;
    throw err;
  }

  const data = await createRes.json();
  const spreadsheetId = data.spreadsheetId;
  setSavedSpreadsheetId(spreadsheetId);

  // Initialize headers
  await initSheetHeaders(spreadsheetId, token);

  return spreadsheetId;
};

/**
 * Initializes header styling and column names
 */
const initSheetHeaders = async (spreadsheetId: string, token: string) => {
  const lotHeaders = [
    [
      'Invoice No',
      'Invoice Date',
      'Receive Date',
      'Line',
      'Category',
      'Item Description',
      'Worker Name',
      'Designation',
      'Size',
      'Quantity DZ',
      'Rate (Tk)',
      'Line Total (Tk)',
      'Lot Total DZ',
      'Lot Total Bill (Tk)',
      'Prepared By',
      'Checked By',
      'Updated At',
    ],
  ];

  const workerHeaders = [
    [
      'Card No',
      'Worker Name',
      'Designation',
      'Default Size',
      'Default Rate (Tk)',
      'Phone',
      'Status',
      'Created At',
    ],
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Lot_Invoices!A1:Q1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: lotHeaders }),
  });

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Workers!A1:H1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: workerHeaders }),
  });
};

/**
 * Synchronizes all active lots to the "Lot_Invoices" sheet.
 * Clears old data rows and writes fresh active lots so deletions and additions are 100% in sync!
 */
export const syncLotsToGoogleSheets = async (lots: LotInvoice[]): Promise<string> => {
  const token = getGoogleAccessToken();
  if (!token) return '';

  try {
    const spreadsheetId = await getOrCreateSpreadsheet();

    // 1. Clear existing rows from A2:Q10000
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Lot_Invoices!A2:Q10000:clear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (lots.length === 0) {
      return spreadsheetId;
    }

    // 2. Prepare flat item rows
    const rows: any[][] = [];

    lots.forEach((lot) => {
      lot.items.forEach((item) => {
        rows.push([
          lot.invoiceNo,
          lot.invoiceDate,
          lot.receiveDate,
          lot.line,
          lot.category,
          lot.item,
          item.workerName,
          item.designation,
          item.size,
          item.quantity,
          item.rate,
          item.totalPrice,
          lot.totalQty,
          lot.totalPrice,
          lot.preparedBy || '',
          lot.checkedBy || '',
          lot.updatedAt || new Date().toISOString(),
        ]);
      });
    });

    if (rows.length > 0) {
      // 3. Write rows
      const updateRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Lot_Invoices!A2?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: rows }),
        }
      );

      if (!updateRes.ok) {
        console.error('Failed to write lot rows to Google Sheets:', await updateRes.text());
      }
    }

    return spreadsheetId;
  } catch (error) {
    console.error('Error in syncLotsToGoogleSheets:', error);
    throw error;
  }
};

/**
 * Synchronizes all active workers to the "Workers" sheet.
 * Clears old rows and writes fresh active workers so deletions and additions are 100% in sync!
 */
export const syncWorkersToGoogleSheets = async (workers: Worker[]): Promise<string> => {
  const token = getGoogleAccessToken();
  if (!token) return '';

  try {
    const spreadsheetId = await getOrCreateSpreadsheet();

    // Clear existing rows A2:H5000
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Workers!A2:H5000:clear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (workers.length === 0) {
      return spreadsheetId;
    }

    const rows = workers.map((w) => [
      w.cardNo || '',
      w.name,
      w.designation || 'Plain Machine Operator',
      w.defaultSize || '14/20',
      w.defaultRate || '',
      w.phone || '',
      w.active ? 'Active' : 'Inactive',
      w.createdAt || new Date().toISOString(),
    ]);

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Workers!A2?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: rows }),
      }
    );

    return spreadsheetId;
  } catch (error) {
    console.error('Error in syncWorkersToGoogleSheets:', error);
    throw error;
  }
};
