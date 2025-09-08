// Supabase Configuration
const supabaseConfig = {
  url: 'https://mzmoxjueezoukioswfga.supabase.co',
  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bW94anVlZXpvdWtpb3N3ZmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzMwNTk4OCwiZXhwIjoyMDcyODgxOTg4fQ.jylJp4xzFOcXTx969LuCIwkNgFtJJFgGmNZ10omliTM',
  databaseUrl: 'postgresql://postgres.mzmoxjueezoukioswfga:WFgTyBHJkrLmn5B5@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require'
}

// File upload configuration
const uploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
  bucketName: 'mintari'
}

module.exports = {
  supabaseConfig,
  uploadConfig
}
