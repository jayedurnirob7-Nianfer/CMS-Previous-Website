const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const cron = require('node-cron');
const { google } = require('googleapis');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// The auto-sync function
async function autoSync() {
  console.log('[Auto-Sync] Starting 12 AM sync...');
  try {
    // 1. Connect to DB
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 2. Auth with Google
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, 'service-account.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    const spreadsheets = [
      { id: '1ADYVV-DEadHNKzphBIRQ8KfqMV9bsH13d54mwQnovS0', name: 'Spreadsheet 2' }
    ];

    const excludedClients = ["C_Forward_PXL Sales", "special_PXL Sales"];
    const excludedServices = ["Social Media Design", "Logo Design", "Packaging Design", "Book Cover Design", "Presentation Design", "UIUX Design"];

    // Ensure Client Model is available
    const ClientSchema = new mongoose.Schema({
      'Client Name': { type: String, required: true },
      category: { type: String, default: 'All' },
      'Type of website': { type: String, default: '' },
      'Profile Name': { type: String, default: '' },
      'Our Domain': { type: String, default: '' },
      'Client Website': { type: String, default: '' },
      'Tags': { type: String, default: '' },
      'Status': { type: String, default: '' },
      'Team Name': { type: String, default: '' },
      'Developer': { type: String, default: '' },
      'Deli_Last_Time': { type: String, default: '' },
      rowIndex: { type: Number },
    }, { timestamps: true });
    
    const ClientModel = mongoose.models.Client || mongoose.model('Client', ClientSchema);

    const inserted = new Set();
    const docs = [];
    let globalRowIdx = 0;

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
            globalRowIdx++;
            const row = values[i];
            if (!row || row.length <= Math.max(clientNameIdx, serviceLineIdx)) continue;
            
            const employeeName = row[employeeNameIdx]?.trim();
            const clientName = row[clientNameIdx]?.trim();
            const serviceLine = row[serviceLineIdx]?.trim();
            const status = row[statusIdx]?.trim();

            if (!clientName) continue;

            // 1. Exclude sales accounts / employees
            const empLower = (employeeName || '').toLowerCase();
            if (empLower.includes('c_forward') || empLower.includes('pxl sales') || empLower.includes('special_pxl')) continue;

            // 2. Exclude sales accounts in client name
            const clientLower = clientName.toLowerCase();
            if (clientLower.includes('c_forward') || clientLower.includes('pxl sales') || clientLower.includes('special_pxl')) continue;

            // 3. Exclude PXL_Special status
            const statusLower = (status || '').toLowerCase();
            if (statusLower.includes('pxl_special') || statusLower.includes('special_pxl')) continue;

            // 4. Exclude non-web service lines (handling hidden \u00a0 non-breaking space)
            const normalizedService = (serviceLine || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
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
            if (normalizedService && excludedServicesNormalized.includes(normalizedService)) continue;

            // 5. Deduplicate
            if (inserted.has(clientName)) continue;
            inserted.add(clientName);

            let category = 'Wordpress';
            if (serviceLine && serviceLine.toLowerCase().includes('wix')) category = 'WIX';
            else if (serviceLine && serviceLine.toLowerCase().includes('shopify')) category = 'Shopify';

            docs.push({
              'Client Name': clientName,
              category: category,
              'Type of website': serviceLine || '',
              'Profile Name': row[profileIdx] || '',
              'Our Domain': '',
              'Client Website': '',
              'Tags': '',
              'Status': row[statusIdx] || 'Good',
              'Team Name': row[teamIdx] || '',
              'Developer': row[developerIdx] || '',
              'Deli_Last_Time': row[deliLastTimeIdx] || '',
              rowIndex: globalRowIdx
            });
          }
        }
      } catch (err) {
        console.error(`[Auto-Sync] Error reading ${sheetObj.name}:`, err.message);
      }
    }

    // Update MongoDB (preserving manual Client Website, Our Domain, and Tags)
    let updatedCount = 0;
    let addedCount = 0;

    for (const doc of docs) {
      const existing = await ClientModel.findOne({ 'Client Name': doc['Client Name'] });
      if (existing) {
        const { 'Client Website': _1, 'Our Domain': _2, 'Tags': _3, ...updateDoc } = doc;
        await ClientModel.updateOne({ _id: existing._id }, { $set: updateDoc });
        updatedCount++;
      } else {
        await ClientModel.create(doc);
        addedCount++;
      }
    }

    console.log(`[Auto-Sync] Complete across all tabs. Updated: ${updatedCount}, Added: ${addedCount}`);
  } catch (error) {
    console.error('[Auto-Sync] Error:', error);
  }
}

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
    
    // Setup Cron Job for 12:00 AM every day
    cron.schedule('0 0 * * *', () => {
      autoSync();
    });
    console.log('> Auto-Sync Cron Job scheduled for 12:00 AM daily.');
  });
});
