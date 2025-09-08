import React, { useState, useCallback, useRef } from 'react'
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Progress } from './ui/progress'
import { toast } from 'sonner'

interface UploadFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface PhotoUploadProps {
  onUploadComplete?: (filePath: string, uploadId: string) => void
  userId: string
  maxFiles?: number
}

export default function PhotoUpload({ onUploadComplete, userId, maxFiles = 1 }: PhotoUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return 'bad_type'
    }

    // Check file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return 'too_large'
    }

    return null
  }

  const showErrorToast = (error: string, fileName: string) => {
    switch (error) {
      case 'too_large':
        toast.error('File Too Large', {
          description: `${fileName} exceeds 10MB limit. Please choose a smaller file.`
        })
        break
      case 'bad_type':
        toast.error('Invalid File Type', {
          description: `${fileName} is not a supported image format. Please use JPG or PNG.`
        })
        break
      case 'failed_upload':
        toast.error('Upload Failed', {
          description: `Failed to upload ${fileName}. Please try again.`
        })
        break
      default:
        toast.error('Upload Error', {
          description: `An error occurred while uploading ${fileName}.`
        })
    }
  }

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const validFiles: UploadFile[] = []

    fileArray.forEach(file => {
      const error = validateFile(file)
      if (error) {
        showErrorToast(error, file.name)
        return
      }

      const uploadFile: UploadFile = {
        file,
        id: Math.random().toString(36).substring(2),
        progress: 0,
        status: 'pending'
      }
      validFiles.push(uploadFile)
    })

    if (validFiles.length > 0) {
      setFiles(prev => {
        const updated = [...prev, ...validFiles]
        return updated.slice(0, maxFiles)
      })
    }
  }, [maxFiles])

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadFile = async (uploadFile: UploadFile) => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f
      ))

      // Get signed upload URL
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: uploadFile.file.name,
          fileType: uploadFile.file.type,
          fileSize: uploadFile.file.size,
          userId: userId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get upload URL')
      }

      // Upload file to Supabase
      const uploadResponse = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: uploadFile.file,
        headers: {
          'Content-Type': uploadFile.file.type,
        }
      })

      if (!uploadResponse.ok) {
        throw new Error('failed_upload')
      }

      // Update progress to 100%
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 100, status: 'success' } : f
      ))

      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete(data.filePath, data.uploadId)
      }

      toast.success('Upload Successful', {
        description: `${uploadFile.file.name} uploaded successfully!`
      })

    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'failed_upload'
      
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'error', error: errorMessage } : f
      ))

      showErrorToast(errorMessage, uploadFile.file.name)
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    
    try {
      // Upload all pending files
      const uploadPromises = files
        .filter(f => f.status === 'pending')
        .map(f => uploadFile(f))
      
      await Promise.all(uploadPromises)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = e.dataTransfer.files
    addFiles(droppedFiles)
  }, [addFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'uploading':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      default:
        return <ImageIcon className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Drag and Drop Area */}
      <Card 
        className={`relative border-2 border-dashed transition-all duration-200 ${
          isDragOver 
            ? 'border-pink-dark bg-pink/10 scale-105' 
            : 'border-mintari-lav hover:border-pink-dark hover:bg-mintari-lav/5'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className={`p-4 rounded-full transition-colors ${
              isDragOver ? 'bg-pink/20' : 'bg-mintari-lav/20'
            }`}>
              <Upload className={`w-8 h-8 transition-colors ${
                isDragOver ? 'text-pink-dark' : 'text-mintari-ink'
              }`} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-mintari-ink">
                {isDragOver ? 'Drop your photos here' : 'Upload your photos'}
              </h3>
              <p className="text-sm text-mintari-ink/70">
                Drag and drop your images here, or click to browse
              </p>
              <p className="text-xs text-mintari-ink/50">
                Supports JPG and PNG files up to 10MB
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/90 border-mintari-lav text-mintari-ink hover:bg-mintari-lav/60"
            >
              Choose Files
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={maxFiles > 1}
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        </div>
      </Card>

      {/* EXIF Strip Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Privacy Note</p>
            <p>EXIF data (location, camera settings) will be automatically removed from your photos for privacy protection.</p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-mintari-ink">Selected Files</h4>
          {files.map((file) => (
            <Card key={file.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {getStatusIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-mintari-ink truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-mintari-ink/60">
                      {formatFileSize(file.file.size)}
                    </p>
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="mt-2 h-1" />
                    )}
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1">
                        {file.error === 'too_large' && 'File too large (max 10MB)'}
                        {file.error === 'bad_type' && 'Invalid file type (JPG/PNG only)'}
                        {file.error === 'failed_upload' && 'Upload failed'}
                      </p>
                    )}
                  </div>
                </div>
                
                {file.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-mintari-ink/60 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <Button
          onClick={handleUpload}
          disabled={isUploading || files.every(f => f.status !== 'pending')}
          className="w-full bg-pink-dark hover:bg-pink text-white font-semibold shadow-vibrant hover:scale-105 transition-all"
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            `Upload ${files.filter(f => f.status === 'pending').length} File${files.filter(f => f.status === 'pending').length !== 1 ? 's' : ''}`
          )}
        </Button>
      )}
    </div>
  )
}
