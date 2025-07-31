import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pageId } = await params;
    const { searchParams } = new URL(req.url);
    const sectionType = searchParams.get('sectionType') || 'sales'; // 'sales' or 'appointment'

    // Fetch all blocks from the page
    const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!blocksResponse.ok) {
      console.error('Failed to fetch blocks');
      return NextResponse.json({ error: 'Failed to fetch page blocks' }, { status: 500 });
    }

    const blocksData = await blocksResponse.json();
    let documentsHeadingId = null;
    let documentsIndex = -1;

    // Find the appropriate heading based on section type
    const targetHeading = sectionType === 'appointment' ? 'appointment documents (owner)' : 'sales documents';
    
    for (let i = 0; i < blocksData.results.length; i++) {
      const block = blocksData.results[i];
      if (block.type === 'heading_2') {
        const headingText = block.heading_2?.rich_text?.[0]?.plain_text || '';
        if (headingText.toLowerCase().includes(targetHeading)) {
          documentsHeadingId = block.id;
          documentsIndex = i;
          break;
        }
      }
    }

    if (!documentsHeadingId) {
      return NextResponse.json({ documents: [] });
    }

    // Get all blocks after the target heading until the next heading or end
    const documents = [];
    for (let i = documentsIndex + 1; i < blocksData.results.length; i++) {
      const block = blocksData.results[i];
      
      // Stop if we hit another heading
      if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
        break;
      }

      // Collect image and file blocks
      if (block.type === 'image' || block.type === 'file') {
        const fileData = block[block.type];
        let fileName = 'Unknown file';
        let fileUrl = '';

        console.log('Block data:', JSON.stringify(block, null, 2)); // Debug log

        if (fileData.type === 'file_upload') {
          fileName = fileData.file_upload?.name || fileData.file_upload?.id || 'Uploaded file';
          fileUrl = fileData.file_upload?.url || '';
        } else if (fileData.type === 'external') {
          fileName = fileData.external?.name || 'External file';
          fileUrl = fileData.external?.url || '';
        } else if (fileData.type === 'file') {
          fileName = fileData.file?.name || 'File';
          fileUrl = fileData.file?.url || '';
        }

        // If still no filename, try to extract from URL or use a default
        if (fileName === 'Unknown file' || fileName === 'Uploaded file') {
          if (fileUrl) {
            // Try to extract filename from URL
            const urlParts = fileUrl.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            if (lastPart && lastPart.includes('.')) {
              fileName = decodeURIComponent(lastPart.split('?')[0]);
            }
          }
          
          // Final fallback with type
          if (fileName === 'Unknown file' || fileName === 'Uploaded file') {
            fileName = `${block.type === 'image' ? 'Image' : 'Document'}_${block.id.slice(-8)}`;
          }
        }

        documents.push({
          id: block.id,
          type: block.type,
          fileName,
          fileUrl,
          createdTime: block.created_time,
          lastEditedTime: block.last_edited_time
        });
      }
    }

    return NextResponse.json({ documents });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fetch documents error:', errorMessage);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pageId } = await params;
    const { searchParams } = new URL(req.url);
    const blockId = searchParams.get('blockId');

    if (!blockId) {
      return NextResponse.json({ error: 'Block ID is required' }, { status: 400 });
    }

    // Delete the block from Notion
    const deleteResponse = await fetch(`https://api.notion.com/v1/blocks/${blockId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.text();
      console.error('Delete failed:', errorData);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Delete document error:', errorMessage);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
