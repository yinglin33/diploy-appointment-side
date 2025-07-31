import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function GET() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
      filter: {
        property: 'Type',
        select: {
          equals: 'Sale'
        }
      }
    });

    const sales = response.results.map((page: Record<string, unknown>) => {
      const properties = page.properties as Record<string, Record<string, unknown>>;
      
      return {
        id: page.id as string,
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
    });

    return NextResponse.json({ sales });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    );
  }
}
