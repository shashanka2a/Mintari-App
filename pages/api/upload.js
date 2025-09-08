import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import { supabaseConfig, uploadConfig } from '../../config/supabase'

const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey)
const prisma = new PrismaClient()

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
    if (!uploadConfig.allowedMimeTypes.includes(fileType)) {
      return res.status(400).json({ 
        error: 'bad_type',
        message: 'Invalid file type. Only JPG and PNG files are allowed.'
      })
    }

    // Validate file size
    if (fileSize > uploadConfig.maxFileSize) {
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
      .from(uploadConfig.bucketName)
      .createSignedUploadUrl(filePath)

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return res.status(500).json({ 
        error: 'failed_upload',
        message: 'Failed to create upload URL. Please try again.'
      })
    }

    // Create upload record in database
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
      console.error('Database error:', dbError)
      return res.status(500).json({ 
        error: 'failed_upload',
        message: 'Failed to create upload record. Please try again.'
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
