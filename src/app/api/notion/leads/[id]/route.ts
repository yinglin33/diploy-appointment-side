import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await notion.pages.retrieve({
      page_id: id,
    });

    const properties = (response as { properties: Record<string, Record<string, unknown>> }).properties;
    
    const lead = {
      id: response.id,
      salesRepresentative: (properties['Sales Representative']?.select as { name?: string })?.name || null,
      leadDate: (properties['Lead Date']?.date as { start?: string })?.start || null,
      customerName: (properties['Customer Name']?.title as { plain_text?: string }[])?.[0]?.plain_text || null,
      address: (properties['Address']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null,
      city: (properties['City']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null,
      state: (properties['State']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null,
      zipCode: (properties['ZIP Code']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null,
      jobType: (properties['Job Type']?.multi_select as { name: string }[])?.map(item => item.name).join(', ') || null,
      equipmentNeeded: (properties['Equipment Needed']?.multi_select as { name: string }[])?.map(item => item.name).join(', ') || null,
      phoneNumber: (properties['Phone Number']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null,
      email: (properties['Email']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null
    };

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead data' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Build the properties object for Notion API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const properties: Record<string, any> = {};

    if (body.customerName !== undefined) {
      properties['Customer Name'] = {
        title: [{ text: { content: body.customerName || '' } }]
      };
    }

    if (body.salesRepresentative !== undefined) {
      properties['Sales Representative'] = body.salesRepresentative 
        ? { select: { name: body.salesRepresentative } }
        : { select: null };
    }

    if (body.leadDate !== undefined) {
      properties['Lead Date'] = body.leadDate 
        ? { date: { start: body.leadDate } }
        : { date: null };
    }

    if (body.address !== undefined) {
      properties['Address'] = {
        rich_text: [{ text: { content: body.address || '' } }]
      };
    }

    if (body.city !== undefined) {
      properties['City'] = {
        rich_text: [{ text: { content: body.city || '' } }]
      };
    }

    if (body.state !== undefined) {
      properties['State'] = {
        rich_text: [{ text: { content: body.state || '' } }]
      };
    }

    if (body.zipCode !== undefined) {
      properties['ZIP Code'] = {
        rich_text: [{ text: { content: body.zipCode || '' } }]
      };
    }

    if (body.jobType !== undefined) {
      const jobTypes = body.jobType ? body.jobType.split(', ').map((type: string) => ({ name: type.trim() })) : [];
      properties['Job Type'] = {
        multi_select: jobTypes
      };
    }

    if (body.equipmentNeeded !== undefined) {
      const equipment = body.equipmentNeeded ? body.equipmentNeeded.split(', ').map((item: string) => ({ name: item.trim() })) : [];
      properties['Equipment Needed'] = {
        multi_select: equipment
      };
    }

    if (body.phoneNumber !== undefined) {
      properties['Phone Number'] = {
        rich_text: [{ text: { content: body.phoneNumber || '' } }]
      };
    }

    if (body.email !== undefined) {
      properties['Email'] = {
        rich_text: [{ text: { content: body.email || '' } }]
      };
    }

    // Update the page in Notion
    await notion.pages.update({
      page_id: id,
      properties
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead data' },
      { status: 500 }
    );
  }
}
