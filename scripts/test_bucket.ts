import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error("Error listing buckets:", error);
    return;
  }
  
  console.log("Buckets:", data.map(b => b.name));

  const hasVerifDocs = data.some(b => b.name === 'verification_documents' || b.name === 'verification-documents');
  if (!hasVerifDocs) {
    console.log("Creating verification_documents bucket...");
    const { data: createData, error: createError } = await supabase.storage.createBucket('verification_documents', {
      public: false, // Explicitly private because signed URLs are used
      allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf'],
      fileSizeLimit: 10485760 // 10MB
    });
    if (createError) console.error("Error creating bucket:", createError);
    else console.log("Created:", createData);
  } else {
    console.log("Bucket already exists");
  }
}

checkBuckets();
