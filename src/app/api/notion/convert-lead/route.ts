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

    // Only update the Type and Sales Date - all other properties will be preserved automatically
    await notion.pages.update({
      page_id: pageId,
      properties: {
        'Type': {
          select: {
            name: 'Sale'
          }
        },
        'Sales Date': {
          date: {
            start: new Date().toISOString().split('T')[0]
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error converting lead to sale:', error);
    return NextResponse.json(
      { error: 'Failed to convert lead to sale' },
      { status: 500 }
    );
  }
}
