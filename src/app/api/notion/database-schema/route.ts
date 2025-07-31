import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function GET() {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID;
    if (!databaseId) {
      throw new Error('NOTION_DATABASE_ID is not configured');
    }

    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });

    interface SchemaOption {
      id: string;
      name: string;
      color: string;
    }

    interface SchemaProperty {
      type: string;
      options: SchemaOption[];
    }

    const properties = (database as { properties: Record<string, unknown> }).properties;
    const schema: Record<string, SchemaProperty> = {};

    interface NotionProperty {
      type: string;
      select?: { options: SchemaOption[] };
      multi_select?: { options: SchemaOption[] };
      status?: { options: SchemaOption[] };
    }

    // Extract select and multi-select options
    for (const [propertyName, property] of Object.entries(properties)) {
      const prop = property as NotionProperty;
      
      if (prop.type === 'select' && prop.select?.options) {
        schema[propertyName] = {
          type: 'select',
          options: prop.select.options.map((option: SchemaOption) => ({
            id: option.id,
            name: option.name,
            color: option.color
          }))
        };
      } else if (prop.type === 'multi_select' && prop.multi_select?.options) {
        schema[propertyName] = {
          type: 'multi_select',
          options: prop.multi_select.options.map((option: SchemaOption) => ({
            id: option.id,
            name: option.name,
            color: option.color
          }))
        };
      } else if (prop.type === 'status' && prop.status?.options) {
        schema[propertyName] = {
          type: 'status',
          options: prop.status.options.map((option: SchemaOption) => ({
            id: option.id,
            name: option.name,
            color: option.color
          }))
        };
      }
    }

    return NextResponse.json({ schema });
  } catch (error) {
    console.error('Error fetching database schema:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database schema' },
      { status: 500 }
    );
  }
}
