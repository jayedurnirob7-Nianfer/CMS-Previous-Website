import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import dbConnect from './mongodb';
import Client from '../models/Client';

export async function syncGoogleSheetsToMongo() {
  await dbConnect();

  let auth;
  const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  } else {
    console.warn('Google service account credentials not found. Skipping Google Sheets sync.');
    return { syncedCount: 0, addedCount: 0, totalProcessed: 0 };
  }

  const sheets = google.sheets({ version: 'v4', auth });

  const spreadsheets = [
    { id: '1A_MuvrT5sCKBgyb83Yx1dDhIda1iy4cVtJjKxuIjze0', name: 'Spreadsheet 1' },
    { id: '1ADYVV-DEadHNKzphBIRQ8KfqMV9bsH13d54mwQnovS0', name: 'Spreadsheet 2' }
  ];

  const excludedServicesNormalized = [
    "social media design",
    "logo design",
    "packaging design",
    "book cover design",
    "presentation design",
    "uiux design",
    "ui/ux design",
    "ui ux design"
  ];

  let syncedCount = 0;
  let addedCount = 0;
  let globalRowIndex = 0;
  const processedClients = new Set();

  for (const sheetObj of spreadsheets) {
    try {
      const info = await sheets.spreadsheets.get({ spreadsheetId: sheetObj.id });
      const tabTitles = info.data.sheets.map(s => s.properties.title);

      for (const tabTitle of tabTitles) {
        if (tabTitle.toLowerCase().includes('validation')) continue;

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetObj.id,
          range: tabTitle,
        });

        const values = response.data.values;
        if (!values || values.length < 2) continue;

        const headers = values[0];
        const employeeNameIdx = headers.indexOf('Employee Name');
        const clientNameIdx = headers.indexOf("Client's Name");
        const serviceLineIdx = headers.indexOf('Service Line');
        const profileIdx = headers.indexOf('Profile');
        const statusIdx = headers.indexOf('Platform Status');
        const teamIdx = headers.indexOf('Assigned Team');
        const developerIdx = headers.indexOf('Assigned person');
        const deliLastTimeIdx = headers.indexOf('Deli_Last_Time');

        for (let i = 1; i < values.length; i++) {
          globalRowIndex++;
          const row = values[i];
          if (!row || row.length <= Math.max(clientNameIdx, serviceLineIdx)) continue;

          const employeeName = row[employeeNameIdx]?.trim();
          const clientName = row[clientNameIdx]?.trim();
          const serviceLine = row[serviceLineIdx]?.trim();
          const status = row[statusIdx]?.trim();

          if (!clientName) continue;

          // Exclude sales accounts / employees
          const empLower = (employeeName || '').toLowerCase();
          if (empLower.includes('c_forward') || empLower.includes('pxl sales') || empLower.includes('special_pxl')) continue;

          // Exclude sales accounts in client name
          const clientLower = clientName.toLowerCase();
          if (clientLower.includes('c_forward') || clientLower.includes('pxl sales') || clientLower.includes('special_pxl')) continue;

          // Exclude PXL_Special status
          const statusLower = (status || '').toLowerCase();
          if (statusLower.includes('pxl_special') || statusLower.includes('special_pxl')) continue;

          // Exclude non-web service lines
          const normalizedService = (serviceLine || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
          if (normalizedService && excludedServicesNormalized.includes(normalizedService)) continue;

          if (processedClients.has(clientName)) continue;
          processedClients.add(clientName);

          let category = 'Wordpress';
          if (serviceLine && serviceLine.toLowerCase().includes('wix')) category = 'WIX';
          else if (serviceLine && serviceLine.toLowerCase().includes('shopify')) category = 'Shopify';

          const updateFields = {
            category,
            'Type of website': serviceLine || '',
            'Profile Name': row[profileIdx] || '',
            'Team Name': row[teamIdx] || '',
            'Developer': row[developerIdx] || '',
            'Deli_Last_Time': row[deliLastTimeIdx] || '',
            rowIndex: globalRowIndex
          };

          const existing = await Client.findOne({ 'Client Name': clientName });
          if (existing) {
            await Client.updateOne({ _id: existing._id }, { $set: updateFields });
            syncedCount++;
          } else {
            await Client.create({
              'Client Name': clientName,
              ...updateFields,
              'Status': status || 'Good',
              'Our Domain': '',
              'Client Website': '',
              'Tags': ''
            });
            addedCount++;
          }
        }
      }
    } catch (sheetErr) {
      console.error(`Error syncing sheet ${sheetObj.id}:`, sheetErr.message);
    }
  }

  return { syncedCount, addedCount, totalProcessed: processedClients.size };
}
