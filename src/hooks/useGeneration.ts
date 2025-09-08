import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface GenerationJob {
  id: string;
  state: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  progress: number;
  url?: string;
  error?: string;
  seed?: number;
  model?: string;
  gen_time_ms?: number;
  errorCode?: string;
}

interface UseGenerationOptions {
  pollInterval?: number;
  onSuccess?: (job: GenerationJob) => void;
  onError?: (job: GenerationJob) => void;
  onProgress?: (progress: number) => void;
}

export function useGeneration(options: UseGenerationOptions = {}) {
  const {
    pollInterval = 2000,
    onSuccess,
    onError,
    onProgress
  } = options;

  const [jobs, setJobs] = useState<Map<string, GenerationJob>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);
  const pollingRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Start generation
  const startGeneration = useCallback(async (
    prompt: string,
    style: string = 'ghibli',
    size: string = '1024x1024',
    uploadId?: string,
    userId: string = 'demo-user-123'
  ) => {
    try {
      setIsGenerating(true);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          style,
          size,
          uploadId,
          userId,
          variantCount: 1
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      if (data.success && data.jobId) {
        // Start polling for this job
        startPolling(data.jobId);
        
        // Add job to state
        const newJob: GenerationJob = {
          id: data.jobId,
          state: 'pending',
          progress: 0
        };
        
        setJobs(prev => new Map(prev).set(data.jobId, newJob));
        
        return data.jobId;
      } else {
        throw new Error(data.error || 'Failed to start generation');
      }

    } catch (error) {
      console.error('Generation start error:', error);
      toast.error('Failed to start generation', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Regenerate job
  const regenerateJob = useCallback(async (
    jobId: string,
    promptDelta?: string,
    lockSeed: boolean = false,
    userId: string = 'demo-user-123'
  ) => {
    try {
      setIsGenerating(true);

      const response = await fetch(`/api/generate/${jobId}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptDelta,
          lockSeed,
          userId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Regeneration failed');
      }

      if (data.success && data.jobId) {
        // Start polling for the new job
        startPolling(data.jobId);
        
        // Add new job to state
        const newJob: GenerationJob = {
          id: data.jobId,
          state: 'pending',
          progress: 0
        };
        
        setJobs(prev => new Map(prev).set(data.jobId, newJob));
        
        return data.jobId;
      } else {
        throw new Error(data.error || 'Failed to start regeneration');
      }

    } catch (error) {
      console.error('Regeneration error:', error);
      toast.error('Failed to regenerate', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Start polling for a job
  const startPolling = useCallback((jobId: string) => {
    // Clear existing polling for this job
    const existingPoll = pollingRefs.current.get(jobId);
    if (existingPoll) {
      clearInterval(existingPoll);
    }

    const poll = setInterval(async () => {
      try {
        const response = await fetch(`/api/generate/${jobId}/status`);
        const data = await response.json();

        if (data.success) {
          const job: GenerationJob = {
            id: jobId,
            state: data.state,
            progress: data.progress || 0,
            url: data.url,
            error: data.error,
            seed: data.seed,
            model: data.model,
            gen_time_ms: data.gen_time_ms,
            errorCode: data.errorCode
          };

          setJobs(prev => new Map(prev).set(jobId, job));

          // Call progress callback
          if (onProgress) {
            onProgress(data.progress || 0);
          }

          // Check if job is in terminal state
          if (['success', 'failed', 'cancelled'].includes(data.state)) {
            clearInterval(poll);
            pollingRefs.current.delete(jobId);

            if (data.state === 'success') {
              toast.success('Generation completed!', {
                description: `Your ${data.model} image is ready`
              });
              if (onSuccess) onSuccess(job);
            } else if (data.state === 'failed') {
              toast.error('Generation failed', {
                description: data.error || 'Unknown error occurred'
              });
              if (onError) onError(job);
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Don't clear the interval on network errors, keep trying
      }
    }, pollInterval);

    pollingRefs.current.set(jobId, poll);
  }, [pollInterval, onSuccess, onError, onProgress]);

  // Stop polling for a job
  const stopPolling = useCallback((jobId: string) => {
    const poll = pollingRefs.current.get(jobId);
    if (poll) {
      clearInterval(poll);
      pollingRefs.current.delete(jobId);
    }
  }, []);

  // Get job by ID
  const getJob = useCallback((jobId: string): GenerationJob | undefined => {
    return jobs.get(jobId);
  }, [jobs]);

  // Get all jobs
  const getAllJobs = useCallback((): GenerationJob[] => {
    return Array.from(jobs.values());
  }, [jobs]);

  // Get jobs by state
  const getJobsByState = useCallback((state: GenerationJob['state']): GenerationJob[] => {
    return Array.from(jobs.values()).filter(job => job.state === state);
  }, [jobs]);

  // Clear completed jobs
  const clearCompletedJobs = useCallback(() => {
    setJobs(prev => {
      const newJobs = new Map();
      prev.forEach((job, id) => {
        if (!['success', 'failed', 'cancelled'].includes(job.state)) {
          newJobs.set(id, job);
        }
      });
      return newJobs;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pollingRefs.current.forEach(poll => clearInterval(poll));
      pollingRefs.current.clear();
    };
  }, []);

  return {
    // State
    jobs: getAllJobs(),
    isGenerating,
    
    // Actions
    startGeneration,
    regenerateJob,
    getJob,
    getJobsByState,
    clearCompletedJobs,
    
    // Utilities
    startPolling,
    stopPolling,
  };
}
