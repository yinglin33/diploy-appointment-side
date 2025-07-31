import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const response = await notion.pages.retrieve({
      page_id: id,
    });

    const properties = (response as { properties: Record<string, Record<string, unknown>> }).properties;
    
    const sale = {
      id: response.id as string,
      salesDate: (properties['Sales Date']?.date as { start?: string })?.start || null,
      appointmentDate: (properties['Appointment Date']?.date as { start?: string })?.start || null,
      salesRepresentative: (properties['Sales Representative']?.select as { name?: string })?.name || null,
      customerName: (properties['Customer Name']?.title as { plain_text?: string }[])?.[0]?.plain_text || null,
      address: (properties['Address']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null,
      city: (properties['City']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null,
      state: (properties['State']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null,
      zipCode: (properties['ZIP Code']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null,
      jobType: (properties['Job Type']?.multi_select as { name: string }[])?.map(item => item.name).join(', ') || null,
      appointmentStatus: (properties['Appointment Status']?.status as { name?: string })?.name || null,
      salesStatus: (properties['Sales Status']?.status as { name?: string })?.name || null,
      equipmentNeeded: (properties['Equipment Needed']?.multi_select as { name: string }[])?.map(item => item.name).join(', ') || null,
      liveRepresentative: (properties['Live Representative']?.select as { name?: string })?.name || null,
      liveRepresentativePaid: (properties['Live Representative Paid']?.select as { name?: string })?.name || null,
      salesRepresentativePaid: (properties['Sales Representative Paid']?.select as { name?: string })?.name || null,
      phoneNumber: (properties['Phone Number']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null,
      email: (properties['Email']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null
    };

    return NextResponse.json({ sale });
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sale data' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
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

    if (body.salesDate !== undefined) {
      properties['Sales Date'] = body.salesDate 
        ? { date: { start: body.salesDate } }
        : { date: null };
    }

    if (body.appointmentDate !== undefined) {
      properties['Appointment Date'] = body.appointmentDate 
        ? { date: { start: body.appointmentDate } }
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

    if (body.appointmentStatus !== undefined) {
      properties['Appointment Status'] = body.appointmentStatus 
        ? { status: { name: body.appointmentStatus } }
        : { status: null };
    }

    if (body.salesStatus !== undefined) {
      properties['Sales Status'] = body.salesStatus 
        ? { status: { name: body.salesStatus } }
        : { status: null };
    }

    if (body.liveRepresentative !== undefined) {
      properties['Live Representative'] = body.liveRepresentative 
        ? { select: { name: body.liveRepresentative } }
        : { select: null };
    }

    if (body.liveRepresentativePaid !== undefined) {
      properties['Live Representative Paid'] = body.liveRepresentativePaid 
        ? { select: { name: body.liveRepresentativePaid } }
        : { select: null };
    }

    if (body.salesRepresentativePaid !== undefined) {
      properties['Sales Representative Paid'] = body.salesRepresentativePaid 
        ? { select: { name: body.salesRepresentativePaid } }
        : { select: null };
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
    console.error('Error updating sale:', error);
    return NextResponse.json(
      { error: 'Failed to update sale data' },
      { status: 500 }
    );
  }
}
