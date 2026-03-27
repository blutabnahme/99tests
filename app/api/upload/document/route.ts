import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const doctorId = formData.get('doctorId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Temporary validation on server side of Doctor ID map, if missing just assign a temp uuid 
    // to allow registration uploads before the doctor ID is fully minted,
    // actually, wait... the instructions say: 
    // "Upload to Supabase Storage bucket doctor-documents with path: {doctor_id}/{filename}"
    // But this happens during registration BEFORE the doctor is fully created. 
    // So the frontend will probably need to generate an ID or use the timestamp/session ID.
    // The instructions say: "The file upload API... accept multipart form data". Let's use doctorId or 'temp'.
    const id = doctorId || Date.now().toString();

    // Verify file size <= 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be strictly less than 5MB' }, { status: 400 });
    }

    // Verify file type is pdf/jpg/jpeg/png
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, JPG, and PNG are allowed' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const buffer = await file.arrayBuffer();
    
    // Create a safe filename
    const safeFilename = `${Date.now()}_doc.${fileExt}`;
    const filePath = `${id}/${safeFilename}`;

    const { data, error } = await supabaseAdmin.storage
      .from('doctor-documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('doctor-documents')
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (err: any) {
    console.error('File Upload Error:', err);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
