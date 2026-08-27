import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const response = await handleUpload({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload || '{}');
        if (!payload?.submissionId || !String(pathname).startsWith('complaints/')) throw new Error('Invalid upload request');
        return { allowedContentTypes: ['image/jpeg','image/png','image/webp'], maximumSizeInBytes: 10 * 1024 * 1024, addRandomSuffix: true };
      },
      onUploadCompleted: async () => { /* Attachment metadata is linked when the complaint is created. */ }
    });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload could not be authorized. Check BLOB_READ_WRITE_TOKEN and the private Blob store connection.' }, { status: 400 });
  }
}
