import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { 
  GENERATION_CONFIG, 
  ERROR_CODES, 
  PROGRESS_CHECKPOINTS 
} from '../../../../lib/gen/constants';
import { 
  parsePromptDelta, 
  generatePromptHash, 
  validatePrompt, 
  checkContentSafety 
} from '../../../../lib/gen/prompt-assembly';

interface RegenerateRequest {
  promptDelta?: string;
  lockSeed?: boolean;
  userId: string;
}

interface RegenerateResponse {
  success: boolean;
  jobId?: string;
  error?: string;
  errorCode?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegenerateResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { jobId } = req.query;
    const { promptDelta, lockSeed = false, userId }: RegenerateRequest = req.body;

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId'
      });
    }

    // Get original job
    const originalJob = await prisma.generationJob.findUnique({
      where: { id: jobId }
    });

    if (!originalJob) {
      return res.status(404).json({
        success: false,
        error: 'Original job not found'
      });
    }

    // Check if user owns the job
    if (originalJob.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if original job was successful
    if (originalJob.state !== 'SUCCESS') {
      return res.status(400).json({
        success: false,
        error: 'Can only regenerate successful jobs'
      });
    }

    // Parse new prompt
    const newPrompt = parsePromptDelta(originalJob.prompt, promptDelta || '');
    
    // Validate new prompt
    const promptValidation = validatePrompt(newPrompt);
    if (!promptValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: promptValidation.error,
        errorCode: ERROR_CODES.INVALID_PROMPT
      });
    }

    // Check content safety
    const safetyCheck = checkContentSafety(newPrompt);
    if (!safetyCheck.isSafe) {
      return res.status(400).json({
        success: false,
        error: 'Content violates safety guidelines',
        errorCode: ERROR_CODES.SAFETY_VIOLATION
      });
    }

    // Check rate limits (reuse the same logic from generate endpoint)
    const windowStart = new Date(Date.now() - GENERATION_CONFIG.RATE_LIMIT.WINDOW_MS);
    const recentJobs = await prisma.generationJob.count({
      where: {
        userId,
        createdAt: {
          gte: windowStart
        }
      }
    });

    if (recentJobs >= GENERATION_CONFIG.RATE_LIMIT.MAX_REQUESTS) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        errorCode: ERROR_CODES.RATE_LIMIT
      });
    }

    // Check active jobs limit
    const activeJobs = await prisma.generationJob.count({
      where: {
        userId,
        state: {
          in: ['PENDING', 'RUNNING']
        }
      }
    });

    if (activeJobs >= 3) {
      return res.status(429).json({
        success: false,
        error: 'Too many active jobs',
        errorCode: ERROR_CODES.QUOTA_EXCEEDED
      });
    }

    // Generate new prompt hash
    const newPromptHash = generatePromptHash(newPrompt);

    // Check for duplicate prompt hash
    const existingJob = await prisma.generationJob.findUnique({
      where: { promptHash: newPromptHash }
    });

    if (existingJob && existingJob.state === 'SUCCESS') {
      return res.status(200).json({
        success: true,
        jobId: existingJob.id
      });
    }

    // Create new generation job
    const newJob = await prisma.generationJob.create({
      data: {
        userId: originalJob.userId,
        uploadId: originalJob.uploadId,
        state: 'PENDING',
        progress: PROGRESS_CHECKPOINTS.QUEUED,
        prompt: newPrompt,
        promptHash: newPromptHash,
        style: originalJob.style,
        size: originalJob.size,
        seed: lockSeed ? originalJob.seed : null,
        lockSeed: lockSeed,
      }
    });

    // Enqueue background task
    setTimeout(async () => {
      try {
        await processRegenerationJob(newJob.id);
      } catch (error) {
        console.error('Regeneration job processing failed:', error);
      }
    }, 100);

    return res.status(200).json({
      success: true,
      jobId: newJob.id
    });

  } catch (error) {
    console.error('Regenerate API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      errorCode: ERROR_CODES.SERVER_ERROR
    });
  }
}

// Background job processor for regeneration
async function processRegenerationJob(jobId: string) {
  const job = await prisma.generationJob.findUnique({
    where: { id: jobId }
  });

  if (!job) {
    console.error('Regeneration job not found:', jobId);
    return;
  }

  try {
    // Update job to running
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        state: 'RUNNING',
        progress: PROGRESS_CHECKPOINTS.PREPROCESS,
        startedAt: new Date()
      }
    });

    // Import bananaAPI here to avoid circular imports
    const { bananaAPI } = await import('../../../../lib/gen/banana-api');

    // Call Banana API
    const bananaResponse = await bananaAPI.generateImage({
      prompt: job.prompt,
      style: job.style as any,
      size: job.size as any,
      seed: job.seed || undefined,
    });

    // Update progress
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        progress: PROGRESS_CHECKPOINTS.UPLOAD
      }
    });

    // Upload to Supabase (simplified)
    const imageUrl = `https://supabase-storage-url/${jobId}.png`;

    // Update job as successful
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        state: 'SUCCESS',
        progress: PROGRESS_CHECKPOINTS.DONE,
        finishedAt: new Date(),
        resultUrl: imageUrl,
        resultImageB64: bananaResponse.imageB64,
        model: bananaResponse.model,
        generationTimeMs: bananaResponse.durationMs,
        seed: bananaResponse.seed
      }
    });

    console.log('Regeneration job completed:', jobId);

  } catch (error) {
    console.error('Regeneration job failed:', error);
    
    // Update job as failed
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        state: 'FAILED',
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: ERROR_CODES.BANANA_ERROR
      }
    });
  }
}
