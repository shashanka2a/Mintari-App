import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StatusResponse {
  success: boolean;
  state?: string;
  progress?: number;
  url?: string;
  error?: string;
  seed?: number;
  model?: string;
  gen_time_ms?: number;
  errorCode?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { jobId } = req.query;

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID'
      });
    }

    // Get job from database
    const job = await prisma.generationJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        state: true,
        progress: true,
        resultUrl: true,
        error: true,
        errorCode: true,
        seed: true,
        model: true,
        generationTimeMs: true,
        userId: true,
        createdAt: true,
        startedAt: true,
        finishedAt: true,
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check if job is in terminal state
    const isTerminal = ['SUCCESS', 'FAILED', 'CANCELLED'].includes(job.state);

    const response: StatusResponse = {
      success: true,
      state: job.state.toLowerCase(),
      progress: job.progress,
    };

    // Add additional fields based on job state
    if (job.state === 'SUCCESS') {
      response.url = job.resultUrl || undefined;
      response.seed = job.seed || undefined;
      response.model = job.model || undefined;
      response.gen_time_ms = job.generationTimeMs || undefined;
    } else if (job.state === 'FAILED') {
      response.error = job.error || 'Unknown error';
      response.errorCode = job.errorCode || undefined;
    }

    // Add cache headers for terminal states
    if (isTerminal) {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Status API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  } finally {
    await prisma.$disconnect();
  }
}
