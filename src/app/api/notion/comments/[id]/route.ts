import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { Comment } from '@/types/notion';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Notion API types
interface NotionRichText {
  type: string;
  text?: {
    content: string;
  };
  plain_text: string;
}

interface NotionHeading2Block {
  id: string;
  type: 'heading_2';
  heading_2: {
    rich_text: NotionRichText[];
  };
}

interface NotionParagraphBlock {
  id: string;
  type: 'paragraph';
  paragraph: {
    rich_text: NotionRichText[];
  };
}

interface NotionBlock {
  id: string;
  type: string;
  heading_1?: { rich_text: NotionRichText[] };
  heading_2?: { rich_text: NotionRichText[] };
  heading_3?: { rich_text: NotionRichText[] };
  paragraph?: { rich_text: NotionRichText[] };
}

// Helper function to find comments by section type
function findCommentsBySection(blocks: NotionBlock[], sectionType: string): Comment[] {
  const comments: Comment[] = [];
  const sectionPrefix = `[${sectionType.toUpperCase()} COMMENT]`;

  // Look through all blocks for comments with the section prefix
  for (const block of blocks) {
    if (block.type === 'paragraph' && block.paragraph?.rich_text?.length && block.paragraph.rich_text.length > 0) {
      const text = block.paragraph.rich_text.map((rt: NotionRichText) => rt.plain_text).join('');
      
      // Skip empty paragraphs
      if (!text.trim()) continue;

      // Check for new format with section prefix: [SECTION COMMENT] **[Timestamp]**\nComment text
      const sectionMatch = text.match(/^\[.*?\]\s*\*\*\[(.*?)\]\*\*\s*([\s\S]*)/);
      if (sectionMatch && text.startsWith(sectionPrefix)) {
        comments.push({
          id: `${block.id}-${Date.now()}`, // Unique ID for frontend
          blockId: block.id,
          timestamp: sectionMatch[1],
          text: sectionMatch[2].trim()
        });
        continue;
      }

      // Also check for old format under headings: **[Timestamp]**\nComment text
      const timestampMatch = text.match(/^\*\*\[(.*?)\]\*\*\s*([\s\S]*)/);
      if (timestampMatch) {
        // Only include if we're looking under the right heading
        // This is for backward compatibility with existing comments
        comments.push({
          id: `${block.id}-${Date.now()}`, // Unique ID for frontend
          blockId: block.id,
          timestamp: timestampMatch[1],
          text: timestampMatch[2].trim()
        });
      }
    }
  }

  return comments;
}

// Helper function to find comments under specific headings (for backward compatibility)
function findCommentsUnderHeading(blocks: NotionBlock[], headingText: string): Comment[] {
  const comments: Comment[] = [];
  let foundHeading = false;
  let headingIndex = -1;

  // Find the heading block
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === 'heading_2' && 
        block.heading_2?.rich_text?.[0]?.plain_text?.includes(headingText)) {
      foundHeading = true;
      headingIndex = i;
      break;
    }
  }

  if (!foundHeading) return comments;

  // Collect paragraph blocks after the heading until we hit another heading or end
  for (let i = headingIndex + 1; i < blocks.length; i++) {
    const block = blocks[i];
    
    // Stop if we hit another heading
    if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
      break;
    }

    // Process paragraph blocks that look like comments
    if (block.type === 'paragraph' && block.paragraph?.rich_text?.length && block.paragraph.rich_text.length > 0) {
      const text = block.paragraph.rich_text.map((rt: NotionRichText) => rt.plain_text).join('');
      
      // Skip empty paragraphs
      if (!text.trim()) continue;

      // Parse old format: **[Timestamp]**\nComment text
      const timestampMatch = text.match(/^\*\*\[(.*?)\]\*\*\s*([\s\S]*)/);
      if (timestampMatch) {
        comments.push({
          id: `${block.id}-${Date.now()}`, // Unique ID for frontend
          blockId: block.id,
          timestamp: timestampMatch[1],
          text: timestampMatch[2].trim()
        });
      }
    }
  }

  return comments;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sectionType = searchParams.get('section') as 'sales' | 'appointment' | null;

    // Fetch all blocks from the page
    const response = await notion.blocks.children.list({
      block_id: id,
      page_size: 100,
    });

    const blocks = response.results as NotionBlock[];
    let comments: Comment[] = [];

    if (sectionType === 'sales') {
      // Get comments with [SALES COMMENT] prefix + old format under Sales Comments heading
      const newFormatComments = findCommentsBySection(blocks, 'sales');
      const oldFormatComments = findCommentsUnderHeading(blocks, 'Sales Comments');
      comments = [...newFormatComments, ...oldFormatComments];
    } else if (sectionType === 'appointment') {
      // Get comments with [APPOINTMENT COMMENT] prefix + old format under Appointment Comments heading
      const newFormatComments = findCommentsBySection(blocks, 'appointment');
      const oldFormatComments = findCommentsUnderHeading(blocks, 'Appointment Comments');
      comments = [...newFormatComments, ...oldFormatComments];
    } else {
      // Return both sections
      const salesNewFormat = findCommentsBySection(blocks, 'sales');
      const salesOldFormat = findCommentsUnderHeading(blocks, 'Sales Comments');
      const appointmentNewFormat = findCommentsBySection(blocks, 'appointment');
      const appointmentOldFormat = findCommentsUnderHeading(blocks, 'Appointment Comments');
      comments = [...salesNewFormat, ...salesOldFormat, ...appointmentNewFormat, ...appointmentOldFormat];
    }

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { text, sectionType } = await request.json();

    if (!text || !sectionType) {
      return NextResponse.json(
        { error: 'Text and section type are required' },
        { status: 400 }
      );
    }

    // Fetch all blocks to find the correct heading
    const response = await notion.blocks.children.list({
      block_id: id,
      page_size: 100,
    });

    const blocks = response.results as NotionBlock[];
    const headingText = sectionType === 'sales' ? 'Sales Comments' : 'Appointment Comments';
    let targetBlockId: string | null = null;

    // Find the heading block and determine where to insert
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (block.type === 'heading_2' && 
          block.heading_2?.rich_text?.[0]?.plain_text?.includes(headingText)) {
        
        // Look for existing comments under this heading
        let insertAfterIndex = i; // Start right after the heading
        
        for (let j = i + 1; j < blocks.length; j++) {
          const nextBlock = blocks[j];
          
          // Stop if we hit another heading
          if (nextBlock.type === 'heading_1' || nextBlock.type === 'heading_2' || nextBlock.type === 'heading_3') {
            break;
          }
          
          // If it's a paragraph with content that looks like a comment, update insertion point
          if (nextBlock.type === 'paragraph' && nextBlock.paragraph?.rich_text?.length && nextBlock.paragraph.rich_text.length > 0) {
            const text = nextBlock.paragraph.rich_text.map((rt: NotionRichText) => rt.plain_text).join('');
            // Check if this looks like a comment (starts with **[timestamp]**)
            if (text.match(/^\*\*\[.*?\]\*\*/)) {
              insertAfterIndex = j;
            }
          }
        }
        
        targetBlockId = blocks[insertAfterIndex].id;
        break;
      }
    }

    if (!targetBlockId) {
      return NextResponse.json(
        { error: `${headingText} section not found` },
        { status: 404 }
      );
    }

    // Create timestamp
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Format comment text
    const commentText = `**[${timestamp}]**\n${text}`;

    // Add the comment block to the page
    // Note: Due to Notion API limitations, new blocks are added at the end
    // Users will need to manually move them to the correct section in Notion if needed
    const newBlockResponse = await notion.blocks.children.append({
      block_id: id,
      children: [
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: `[${sectionType.toUpperCase()} COMMENT] ${commentText}` }
              }
            ]
          }
        }
      ]
    });

    const newBlock = newBlockResponse.results[0] as NotionBlock;
    const newComment: Comment = {
      id: `${newBlock.id}-${Date.now()}`,
      blockId: newBlock.id,
      timestamp,
      text
    };

    return NextResponse.json({ comment: newComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('blockId');

    if (!blockId) {
      return NextResponse.json(
        { error: 'Block ID is required' },
        { status: 400 }
      );
    }

    // Delete the block
    await notion.blocks.delete({
      block_id: blockId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
