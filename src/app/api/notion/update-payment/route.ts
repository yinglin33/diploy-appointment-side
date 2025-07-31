import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function PATCH(request: Request) {
  try {
    const { pageId, allPaymentsFinished } = await request.json();

    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }

    await notion.pages.update({
      page_id: pageId,
      properties: {
        'All Payments Finished': {
          select: {
            name: allPaymentsFinished ? 'Yes' : 'No'
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}
