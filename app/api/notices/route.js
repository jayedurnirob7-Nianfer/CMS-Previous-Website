import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Notice from '../../../models/Notice';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = {};
    if (category && category !== 'All') {
      query = { $or: [{ category: category }, { category: 'All' }] };
    }

    const notices = await Notice.find(query)
      .sort({ isPinned: -1, order: 1, createdAt: -1 })
      .lean();

    const formattedNotices = notices.map(notice => ({
      ...notice,
      _id: notice._id.toString(),
    }));

    return NextResponse.json(formattedNotices, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { title, content, link, category, isPinned, order } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const newNotice = new Notice({
      title,
      content,
      link: link || '',
      category: category || 'All',
      isPinned: isPinned !== undefined ? isPinned : true,
      order: order !== undefined ? order : 0,
    });

    await newNotice.save();
    return NextResponse.json(newNotice, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();

    if (body.action === 'reorder' && Array.isArray(body.items)) {
      await Promise.all(
        body.items.map(item =>
          Notice.findByIdAndUpdate(item.id, { order: item.order })
        )
      );
      return NextResponse.json({ status: 'success' });
    }

    const { id, title, content, link, category, isPinned, order } = body;

    if (!id) {
      return NextResponse.json({ error: 'Notice ID is required' }, { status: 400 });
    }

    const updateDoc = {};
    if (title !== undefined) updateDoc.title = title;
    if (content !== undefined) updateDoc.content = content;
    if (link !== undefined) updateDoc.link = link;
    if (category !== undefined) updateDoc.category = category;
    if (isPinned !== undefined) updateDoc.isPinned = isPinned;
    if (order !== undefined) updateDoc.order = order;

    const updated = await Notice.findByIdAndUpdate(
      id,
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Notice ID is required' }, { status: 400 });
    }

    const deleted = await Notice.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
