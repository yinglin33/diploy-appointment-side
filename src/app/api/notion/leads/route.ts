import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function POST(request: Request) {
  try {
    const leadData = await request.json();

    const response = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_DATABASE_ID!,
      },
      properties: {
        'Type': {
          select: {
            name: 'Lead'
          }
        },
        'Customer Name': {
          title: [
            {
              text: {
                content: leadData.customerName || ''
              }
            }
          ]
        },
        ...(leadData.salesRepresentative && {
          'Sales Representative': {
            select: {
              name: leadData.salesRepresentative
            }
          }
        }),
        ...(leadData.leadDate && {
          'Lead Date': {
            date: {
              start: leadData.leadDate
            }
          }
        }),
        'Address': {
          rich_text: [
            {
              text: {
                content: leadData.address || ''
              }
            }
          ]
        },
        'City': {
          rich_text: [
            {
              text: {
                content: leadData.city || ''
              }
            }
          ]
        },
        'State': {
          rich_text: [
            {
              text: {
                content: leadData.state || ''
              }
            }
          ]
        },
        'ZIP Code': {
          rich_text: [
            {
              text: {
                content: leadData.zipCode || ''
              }
            }
          ]
        },
        ...(leadData.jobType && {
          'Job Type': {
            multi_select: leadData.jobType.split(', ').map((type: string) => ({ name: type.trim() }))
          }
        }),
        'Phone Number': {
          rich_text: [
            {
              text: {
                content: leadData.phoneNumber || ''
              }
            }
          ]
        },
        'Email': {
          rich_text: [
            {
              text: {
                content: leadData.email || ''
              }
            }
          ]
        },
        ...(leadData.equipmentNeeded && {
          'Equipment Needed': {
            multi_select: leadData.equipmentNeeded.split(', ').map((type: string) => ({ name: type.trim() }))
          }
        })
      }
    });

    // Add template content to the page (the page created by the Customer Name title property)
    try {
      const templateBlocks = [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Sales Comments' }
              }
            ]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: []
          }
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Sales Documents' }
              }
            ]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: []
          }
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Appointment Comments' }
              }
            ]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: []
          }
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Appointment Documents (Owner)' }
              }
            ]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: []
          }
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Appointment Documents (Live Representative)' }
              }
            ]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: []
          }
        }
      ];

      // Add template blocks to the new page
      await notion.blocks.children.append({
        block_id: response.id,
        children: templateBlocks as Parameters<typeof notion.blocks.children.append>[0]['children']
      });

      console.log('Template successfully added to lead page:', response.id);
    } catch (templateError) {
      // Log the error but don't fail the lead creation
      console.error('Error adding template to lead page:', templateError);
      // The lead was still created successfully, so we continue
    }

    return NextResponse.json({ success: true, id: response.id });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
      filter: {
        property: 'Type',
        select: {
          equals: 'Lead'
        }
      }
    });

    const leads = response.results.map((page: Record<string, unknown>) => {
      const properties = page.properties as Record<string, Record<string, unknown>>;
      
      return {
        id: page.id as string,
        salesRepresentative: (properties['Sales Representative']?.select as { name?: string })?.name || null,
        leadDate: (properties['Lead Date']?.date as { start?: string })?.start || null,
        customerName: (properties['Customer Name']?.title as { plain_text?: string }[])?.[0]?.plain_text || null,
        address: (properties['Address']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null,
        city: (properties['City']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null,
        state: (properties['State']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null,
        zipCode: (properties['ZIP Code']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null,
        jobType: (properties['Job Type']?.multi_select as { name: string }[])?.map(item => item.name).join(', ') || null,
        phoneNumber: (properties['Phone Number']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null,
        email: (properties['Email']?.rich_text as { plain_text?: string }[])?.[0]?.plain_text || null,
        equipmentNeeded: (properties['Equipment Needed']?.multi_select as { name: string }[])?.map(item => item.name).join(', ') || null
      };
    });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads data' },
      { status: 500 }
    );
  }
}
