import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pageId } = await params;
    
    // NOTE: Parsing the uploaded file from FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file || !pageId) {
      return NextResponse.json({ error: 'File and pageId are required' }, { status: 400 });
    }

    // Allow both images and PDFs
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only image files and PDFs are allowed' }, { status: 400 });
    }

    const maxSize = 20 * 1024 * 1024; // NOTE: 20MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 20MB' }, { status: 400 });
    }

    // STEP 1: Create File Upload Object
    const fileCreateResponse = await fetch('https://api.notion.com/v1/file_uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type
      })
    });

    if (!fileCreateResponse.ok) {
      const errorData = await fileCreateResponse.text();
      console.error('Step 1 failed:', errorData);
      return NextResponse.json({ error: 'Failed to create file upload object' }, { status: 500 });
    }

    const fileUploadData = await fileCreateResponse.json();
    const { id: fileUploadId, upload_url } = fileUploadData;

    // STEP 2: Upload File Content to Notion
    const fileFormData = new FormData();
    fileFormData.append('file', file);

    const uploadResponse = await fetch(upload_url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28'
      },
      body: fileFormData
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      console.error('Step 2 failed:', errorData);
      return NextResponse.json({ error: 'Failed to upload file content' }, { status: 500 });
    }

    // STEP 3: Find the appropriate documents heading and insert file after it
    const { searchParams } = new URL(req.url);
    const sectionType = searchParams.get('sectionType') || 'sales'; // 'sales' or 'appointment'
    
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
    let insertAfterBlockId = null;

    // Find the appropriate heading based on section type
    const targetHeading = sectionType === 'appointment' ? 'appointment documents (owner)' : 'sales documents';
    const sectionName = sectionType === 'appointment' ? 'Appointment Documents (Owner)' : 'Sales Documents';

    for (let i = 0; i < blocksData.results.length; i++) {
      const block = blocksData.results[i];
      if (block.type === 'heading_2') {
        const headingText = block.heading_2?.rich_text?.[0]?.plain_text || '';
        if (headingText.toLowerCase().includes(targetHeading)) {
          documentsHeadingId = block.id;
          
          // Look for existing files/images after this heading to insert after them
          let lastFileIndex = i;
          for (let j = i + 1; j < blocksData.results.length; j++) {
            const nextBlock = blocksData.results[j];
            // Stop if we hit another heading
            if (nextBlock.type === 'heading_1' || nextBlock.type === 'heading_2' || nextBlock.type === 'heading_3') {
              break;
            }
            // If it's a file or image, update the last file index
            if (nextBlock.type === 'file' || nextBlock.type === 'image') {
              lastFileIndex = j;
            }
          }
          
          insertAfterBlockId = blocksData.results[lastFileIndex].id;
          break;
        }
      }
    }

    if (!documentsHeadingId) {
      return NextResponse.json({ 
        error: `"${sectionName}" section does not exist.` 
      }, { status: 404 });
    }

    // Create the appropriate block type based on file type
    const blockData = file.type === 'application/pdf' ? {
      type: 'file',
      file: {
        type: 'file_upload',
        file_upload: {
          id: fileUploadId
        },
        caption: []
      }
    } : {
      type: 'image',
      image: {
        type: 'file_upload',
        file_upload: {
          id: fileUploadId
        },
        caption: []
      }
    };

    // NOTE: inserting the file after the last file in the target documents section (or after the heading if no files exist)
    const attachResponse = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        children: [blockData],
        after: insertAfterBlockId
      })
    });

    if (!attachResponse.ok) {
      const errorData = await attachResponse.text();
      console.error('Step 3 failed:', errorData);
      return NextResponse.json({ error: 'Failed to attach file to page' }, { status: 500 });
    }

    const attachData = await attachResponse.json();
    
    return NextResponse.json({ 
      success: true, 
      message: `${file.type === 'application/pdf' ? 'PDF' : 'Image'} uploaded successfully`,
      blockId: attachData.results?.[0]?.id 
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Upload error:', errorMessage);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
