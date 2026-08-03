import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Client from '../../../models/Client';

export const dynamic = 'force-dynamic';

const ALL_DEFAULT_PROFILES = [
  'thestudioxx_fiverr',
  'graphixnest_fiverr',
  'Coppercart_fiverr',
  'pixelora_studio_fiverr',
  'Hypercanvas',
  'ink_byte_studio_fiverr',
  'Verispace_fiverr',
  'snaplify',
  'orbitnexa_fiverr',
  'sketchmuse_fiverr',
  'vectorslide',
  'Cloudnoval',
  'gridmorph',
  'prism_path',
  'socio_vista_fiverr',
  'Vanilawix_fiverr'
];

// Temporary in-memory settings since we don't have a settings model yet
let settings = {
  siteName: 'CMS Dashboard',
  profiles: ALL_DEFAULT_PROFILES,
  kamSheetId: '',
  password: 'admin', // The default password, normally stored securely
};

// Server-side in-memory data cache
let dataCache = {
  data: null,
  timestamp: 0,
};
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function invalidateCache() {
  dataCache.data = null;
  dataCache.timestamp = 0;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const forceFresh = searchParams.get('fresh') === 'true' || request.headers.get('cache-control') === 'no-cache';

  try {
    await dbConnect();

    if (action === 'getAllData') {
      const now = Date.now();
      if (!forceFresh && dataCache.data && (now - dataCache.timestamp < CACHE_TTL_MS)) {
        return NextResponse.json(dataCache.data);
      }

      const clients = await Client.find({}).select('-__v').sort({ createdAt: -1 }).lean();
      
      const formattedClients = clients.map(client => ({
        ...client,
        rowIndex: client._id.toString(),
      }));
      
      dataCache.data = formattedClients;
      dataCache.timestamp = now;

      return NextResponse.json(formattedClients, {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        }
      });
    }

    if (action === 'getSettings') {
      return NextResponse.json({
        siteName: settings.siteName,
        profiles: settings.profiles,
        kamSheetId: settings.kamSheetId
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);
    const { action } = body;

    if (action === 'create') {
      const newClient = new Client(body);
      await newClient.save();
      invalidateCache();
      return NextResponse.json({ status: 'success', data: newClient });
    }

    if (action === 'update') {
      const { rowIndex, oldSheet, ...updateData } = body;
      await Client.findByIdAndUpdate(rowIndex, updateData);
      invalidateCache();
      return NextResponse.json({ status: 'success' });
    }

    if (action === 'delete') {
      const { rowIndex, password } = body;
      if (password !== settings.password) {
        return NextResponse.json({ status: 'error', error: 'Invalid password' });
      }
      await Client.findByIdAndDelete(rowIndex);
      invalidateCache();
      return NextResponse.json({ status: 'success' });
    }

    if (action === 'updateSettings') {
      const { password, newSiteName, newPassword, newProfiles, newKamSheetId } = body;
      
      // Simple login check
      if (!newSiteName && !newPassword && !newProfiles && password) {
         if (password === settings.password) return NextResponse.json({ status: 'success' });
         return NextResponse.json({ status: 'error', error: 'Invalid password' });
      }

      if (password !== settings.password) {
        return NextResponse.json({ status: 'error', error: 'Invalid password' });
      }

      if (newSiteName) settings.siteName = newSiteName;
      if (newPassword) settings.password = newPassword;
      if (newProfiles) settings.profiles = newProfiles;
      if (newKamSheetId !== undefined) settings.kamSheetId = newKamSheetId;
      
      return NextResponse.json({ status: 'success' });
    }

    if (action === 'importData') {
      // In the new architecture, the KAM import can be handled here or replaced entirely
      // by the 12 AM auto-sync. We'll return success to avoid frontend errors.
      return NextResponse.json({ status: 'success', updated: 0, added: 0, skipped: 0 });
    }

    if (action === 'importCSV') {
      const { password, records } = body;
      if (password !== settings.password) {
        return NextResponse.json({ status: 'error', error: 'Invalid password' });
      }

      if (!Array.isArray(records)) {
        return NextResponse.json({ status: 'error', error: 'Invalid records payload' });
      }

      let updatedCount = 0;
      let addedCount = 0;

      for (const record of records) {
        const clientName = record['Client Name']?.trim();
        if (!clientName) continue;

        // Case-insensitive regex matching for Client Name
        const escapedName = clientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existing = await Client.findOne({ 
          'Client Name': { $regex: new RegExp(`^${escapedName}$`, 'i') } 
        });

        // Helper: only accept value as URL if it looks like one
        const isValidUrl = (val) => val && (val.startsWith('http') || val.startsWith('www.') || val.includes('.'));
        const PLATFORM_NAMES = ['wordpress', 'shopify', 'wix', 'squarespace', 'webflow'];
        const isPlatformName = (val) => val && PLATFORM_NAMES.includes(val.trim().toLowerCase());

        if (existing) {
          const updateData = {};
          const cw = (record['Client Website'] || '').trim();
          const od = (record['Our Domain'] || '').trim();
          if (cw && isValidUrl(cw) && !isPlatformName(cw)) {
            updateData['Client Website'] = cw;
          }
          if (od && isValidUrl(od) && !isPlatformName(od)) {
            updateData['Our Domain'] = od;
          }
          if (record['Developer'] !== undefined && record['Developer'] !== '') {
            updateData['Developer'] = record['Developer'].trim();
          }
          if (record['Status'] !== undefined && record['Status'] !== '') {
            updateData['Status'] = record['Status'].trim();
          }
          if (record['Deli_Last_Time'] !== undefined && record['Deli_Last_Time'] !== '') {
            updateData['Deli_Last_Time'] = record['Deli_Last_Time'].trim();
          }
          if (record['Profile Name'] !== undefined && record['Profile Name'] !== '') {
            updateData['Profile Name'] = record['Profile Name'].trim();
          }

          if (Object.keys(updateData).length > 0) {
            await Client.updateMany(
              { 'Client Name': { $regex: new RegExp(`^${escapedName}$`, 'i') } },
              { $set: updateData }
            );
            updatedCount++;
          }
        } else {
          let category = record['category'] || record['Type of website'] || 'Wordpress';
          if (category.toLowerCase().includes('wix')) category = 'WIX';
          else if (category.toLowerCase().includes('shopify')) category = 'Shopify';
          else category = 'Wordpress';

          await Client.create({
            'Client Name': clientName,
            category: category,
            'Type of website': record['Type of website'] || category,
            'Profile Name': record['Profile Name'] || '',
            'Our Domain': record['Our Domain'] || '',
            'Client Website': record['Client Website'] || '',
            'Developer': record['Developer'] || '',
            'Status': record['Status'] || 'Good',
            'Deli_Last_Time': record['Deli_Last_Time'] || ''
          });
          addedCount++;
        }
      }

      invalidateCache();
      return NextResponse.json({ status: 'success', updatedCount, addedCount });
    }

    return NextResponse.json({ status: 'error', error: 'Invalid action' });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
