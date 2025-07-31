import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function PATCH(request: Request) {
  try {
    const { pageId } = await request.json();

    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }

    await notion.pages.update({
      page_id: pageId,
      properties: {
        'Type': {
          select: {
            name: 'Canceled'
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error canceling lead:', error);
    return NextResponse.json(
      { error: 'Failed to cancel lead' },
      { status: 500 }
    );
  }
}
