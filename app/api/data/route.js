import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Client from '../../../models/Client';

// Temporary in-memory settings since we don't have a settings model yet
let settings = {
  siteName: 'CMS Dashboard',
  profiles: ['thestudioxx_fiverr', 'sketchmuse_fiverr'],
  kamSheetId: '',
  password: 'admin', // The default password, normally stored securely
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    await dbConnect();

    if (action === 'getAllData') {
      const clients = await Client.find({}).sort({ createdAt: -1 }).lean();
      
      // The frontend expects the `_id` to be mapped to `rowIndex` or similar so it can be updated
      const formattedClients = clients.map(client => ({
        ...client,
        rowIndex: client._id.toString(), // Use _id as rowIndex to maintain compatibility
      }));
      
      return NextResponse.json(formattedClients);
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
      return NextResponse.json({ status: 'success', data: newClient });
    }

    if (action === 'update') {
      const { rowIndex, oldSheet, ...updateData } = body;
      await Client.findByIdAndUpdate(rowIndex, updateData);
      return NextResponse.json({ status: 'success' });
    }

    if (action === 'delete') {
      const { rowIndex, password } = body;
      if (password !== settings.password) {
        return NextResponse.json({ status: 'error', error: 'Invalid password' });
      }
      await Client.findByIdAndDelete(rowIndex);
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

        const existing = await Client.findOne({ 'Client Name': clientName });
        if (existing) {
          const updateData = {};
          if (record['Client Website'] !== undefined) updateData['Client Website'] = record['Client Website'];
          if (record['Our Domain']) updateData['Our Domain'] = record['Our Domain'];
          if (record['Developer']) updateData['Developer'] = record['Developer'];
          if (record['Status']) updateData['Status'] = record['Status'];

          if (Object.keys(updateData).length > 0) {
            await Client.updateOne({ _id: existing._id }, { $set: updateData });
            updatedCount++;
          }
        } else {
          await Client.create(record);
          addedCount++;
        }
      }

      return NextResponse.json({ status: 'success', updatedCount, addedCount });
    }

    return NextResponse.json({ status: 'error', error: 'Invalid action' });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
