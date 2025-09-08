import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { 
  GENERATION_CONFIG, 
  ERROR_CODES, 
  PROGRESS_CHECKPOINTS,
  type JobState 
} from '../../../lib/gen/constants';
import { 
  assemblePrompt, 
  generatePromptHash, 
  validatePrompt, 
  validateStyle, 
  validateSize,
  checkContentSafety 
} from '../../../lib/gen/prompt-assembly';
import { bananaAPI } from '../../../lib/gen/banana-api';

interface GenerateRequest {
  prompt: string;
  style?: string;
  size?: string;
  uploadId?: string;
  userId: string;
  variantCount?: number;
}

interface GenerateResponse {
  success: boolean;
  jobId?: string;
  error?: string;
  errorCode?: string;
}

// Rate limiting check
async function checkRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
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
    return { 
      allowed: false, 
      retryAfter: Math.ceil(GENERATION_CONFIG.RATE_LIMIT.WINDOW_MS / 1000) 
    };
  }
  
  return { allowed: true };
}

// Check active jobs limit
async function checkActiveJobsLimit(userId: string): Promise<{ allowed: boolean; activeCount: number }> {
  const activeJobs = await prisma.generationJob.count({
    where: {
      userId,
      state: {
        in: ['PENDING', 'RUNNING']
      }
    }
  });
  
  return { 
    allowed: activeJobs < 3, // Max 3 active jobs per user
    activeCount: activeJobs 
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { prompt, style = 'ghibli', size = '1024x1024', uploadId, userId, variantCount = 1 }: GenerateRequest = req.body;

    // Validate required fields
    if (!prompt || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: prompt, userId',
        errorCode: ERROR_CODES.INVALID_PROMPT
      });
    }

    // Validate prompt
    const promptValidation = validatePrompt(prompt);
    if (!promptValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: promptValidation.error,
        errorCode: ERROR_CODES.INVALID_PROMPT
      });
    }

    // Check content safety
    const safetyCheck = checkContentSafety(prompt);
    if (!safetyCheck.isSafe) {
      return res.status(400).json({
        success: false,
        error: 'Content violates safety guidelines',
        errorCode: ERROR_CODES.SAFETY_VIOLATION
      });
    }

    // Validate style and size
    if (!validateStyle(style)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid style',
        errorCode: ERROR_CODES.INVALID_PROMPT
      });
    }

    if (!validateSize(size)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid size',
        errorCode: ERROR_CODES.INVALID_PROMPT
      });
    }

    // Validate variant count
    if (variantCount > GENERATION_CONFIG.MAX_VARIANTS) {
      return res.status(400).json({
        success: false,
        error: `Too many variants (max ${GENERATION_CONFIG.MAX_VARIANTS})`,
        errorCode: ERROR_CODES.QUOTA_EXCEEDED
      });
    }

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        errorCode: ERROR_CODES.RATE_LIMIT
      });
    }

    // Check active jobs limit
    const activeJobsCheck = await checkActiveJobsLimit(userId);
    if (!activeJobsCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Too many active jobs (${activeJobsCheck.activeCount}/3)`,
        errorCode: ERROR_CODES.QUOTA_EXCEEDED
      });
    }

    // Assemble final prompt
    const finalPrompt = assemblePrompt(prompt, style as any);
    const promptHash = generatePromptHash(finalPrompt);

    // Check for duplicate prompt hash
    const existingJob = await prisma.generationJob.findUnique({
      where: { promptHash }
    });

    if (existingJob && existingJob.state === 'SUCCESS') {
      return res.status(200).json({
        success: true,
        jobId: existingJob.id
      });
    }

    // Create generation job
    const job = await prisma.generationJob.create({
      data: {
        userId,
        uploadId: uploadId || null,
        state: 'PENDING',
        progress: PROGRESS_CHECKPOINTS.QUEUED,
        prompt: finalPrompt,
        promptHash,
        style,
        size,
        seed: null,
        lockSeed: false,
      }
    });

    // Enqueue background task (in a real app, you'd use a proper queue like Bull, Agenda, etc.)
    // For now, we'll simulate this with a setTimeout
    setTimeout(async () => {
      try {
        await processGenerationJob(job.id);
      } catch (error) {
        console.error('Background job processing failed:', error);
      }
    }, 100);

    return res.status(200).json({
      success: true,
      jobId: job.id
    });

  } catch (error) {
    console.error('Generation API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      errorCode: ERROR_CODES.SERVER_ERROR
    });
  }
}

// Background job processor
async function processGenerationJob(jobId: string) {
  const job = await prisma.generationJob.findUnique({
    where: { id: jobId }
  });

  if (!job) {
    console.error('Job not found:', jobId);
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

    // Upload to Supabase (simplified - in real app, you'd upload the base64 image)
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

    console.log('Generation job completed:', jobId);

  } catch (error) {
    console.error('Generation job failed:', error);
    
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
