import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mzmoxjueezoukioswfga.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bW94anVlZXpvdWtpb3N3ZmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzMwNTk4OCwiZXhwIjoyMDcyODgxOTg4fQ.jylJp4xzFOcXTx969LuCIwkNgFtJJFgGmNZ10omliTM'
)

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres.mzmoxjueezoukioswfga:WFgTyBHJkrLmn5B5@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'
    }
  }
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { fileName, fileType, fileSize, userId } = req.body

    // Validate required fields
    if (!fileName || !fileType || !fileSize || !userId) {
      return res.status(400).json({ 
        error: 'bad_request',
        message: 'Missing required fields: fileName, fileType, fileSize, userId'
      })
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedMimeTypes.includes(fileType)) {
      return res.status(400).json({ 
        error: 'bad_type',
        message: 'Invalid file type. Only JPG and PNG files are allowed.'
      })
    }

    // Validate file size
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    if (fileSize > maxFileSize) {
      return res.status(400).json({ 
        error: 'too_large',
        message: 'File too large. Maximum size is 10MB.'
      })
    }

    // Generate unique file path
    const timestamp = Date.now()
    const fileExtension = fileName.split('.').pop()
    const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`
    const filePath = `${userId}/${uniqueFileName}`

    // Create signed upload URL
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('mintari')
      .createSignedUploadUrl(filePath)

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return res.status(500).json({ 
        error: 'failed_upload',
        message: `Failed to create upload URL: ${uploadError.message}`,
        details: uploadError
      })
    }

    // Create upload record in database (optional - skip if no database connection)
    try {
      const uploadRecord = await prisma.upload.create({
        data: {
          userId: userId,
          fileName: fileName,
          filePath: filePath,
          fileSize: fileSize,
          mimeType: fileType,
          status: 'PENDING',
          uploadUrl: uploadData.signedUrl
        }
      })

      return res.status(200).json({
        success: true,
        uploadUrl: uploadData.signedUrl,
        filePath: filePath,
        uploadId: uploadRecord.id,
        message: 'Upload URL created successfully'
      })

    } catch (dbError) {
      console.error('Database error (continuing without DB):', dbError)
      
      // Continue without database - just return the upload URL
      return res.status(200).json({
        success: true,
        uploadUrl: uploadData.signedUrl,
        filePath: filePath,
        uploadId: `temp-${Date.now()}`, // Temporary ID
        message: 'Upload URL created successfully (no database record)'
      })
    }

  } catch (error) {
    console.error('Upload API error:', error)
    return res.status(500).json({ 
      error: 'failed_upload',
      message: 'Internal server error. Please try again.'
    })
  } finally {
    await prisma.$disconnect()
  }
}

// Handle CORS preflight
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
