import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RefreshCw, Save, Coins, ShoppingCart, Download } from 'lucide-react';
import { GenerationJob } from '../hooks/useGeneration';

interface GenerationGridProps {
  jobs: GenerationJob[];
  isGenerating: boolean;
  onRegenerate: (jobId: string, promptDelta?: string, lockSeed?: boolean) => void;
  onSaveToCollection: (jobId: string) => void;
  onMintNFT: (jobId: string) => void;
  onOrderFrame: (jobId: string) => void;
  onDownload: (jobId: string) => void;
}

export default function GenerationGrid({
  jobs,
  isGenerating,
  onRegenerate,
  onSaveToCollection,
  onMintNFT,
  onOrderFrame,
  onDownload
}: GenerationGridProps) {
  const renderSkeletonTile = (index: number) => (
    <Card key={`skeleton-${index}`} className="bg-white/90 backdrop-blur-sm border-mintari-lav shadow-vibrant rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        {/* Skeleton Image */}
        <div className="w-full h-64 bg-gradient-to-br from-mintari-lav/20 to-pink/20 animate-pulse relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/80 rounded-lg p-2">
              <div className="h-2 bg-mintari-lav/30 rounded animate-pulse mb-1"></div>
              <div className="h-2 bg-mintari-lav/20 rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        </div>
        
        {/* Skeleton Actions */}
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="h-8 bg-mintari-lav/20 rounded animate-pulse flex-1"></div>
            <div className="h-8 bg-mintari-lav/20 rounded animate-pulse flex-1"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-mintari-lav/20 rounded animate-pulse flex-1"></div>
            <div className="h-8 bg-mintari-lav/20 rounded animate-pulse flex-1"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderJobTile = (job: GenerationJob) => {
    const isCompleted = job.state === 'success';
    const isFailed = job.state === 'failed';
    const isRunning = job.state === 'running';
    const isPending = job.state === 'pending';

    return (
      <Card key={job.id} className="bg-white/90 backdrop-blur-sm border-mintari-lav shadow-vibrant rounded-2xl overflow-hidden hover:scale-105 transition-all duration-200">
        <CardContent className="p-0">
          {/* Image or Placeholder */}
          <div className="w-full h-64 relative">
            {isCompleted && job.url ? (
              <img
                src={job.url}
                alt="Generated image"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-mintari-lav/20 to-pink/20 flex items-center justify-center relative">
                {isRunning && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                )}
                
                {isPending && (
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-mintari-lav border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-mintari-ink/70 text-sm">Queued...</p>
                  </div>
                )}
                
                {isRunning && (
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-pink border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-mintari-ink/70 text-sm">Generating...</p>
                    <p className="text-mintari-ink/50 text-xs">{job.progress}%</p>
                  </div>
                )}
                
                {isFailed && (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-red-600 text-xl">⚠️</span>
                    </div>
                    <p className="text-red-600 text-sm">Failed</p>
                    <p className="text-red-500 text-xs">{job.error}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Progress Bar */}
            {(isRunning || isPending) && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div 
                  className="h-full bg-gradient-to-r from-pink to-lavender transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                ></div>
              </div>
            )}
            
            {/* Status Badge */}
            <div className="absolute top-2 right-2">
              {isCompleted && (
                <Badge className="bg-green-500 text-white">Complete</Badge>
              )}
              {isFailed && (
                <Badge className="bg-red-500 text-white">Failed</Badge>
              )}
              {isRunning && (
                <Badge className="bg-blue-500 text-white">Generating</Badge>
              )}
              {isPending && (
                <Badge className="bg-yellow-500 text-white">Pending</Badge>
              )}
            </div>
          </div>
          
          {/* Job Info */}
          <div className="p-4 space-y-3">
            {/* Model and Generation Time */}
            {isCompleted && (
              <div className="text-xs text-mintari-ink/60 space-y-1">
                {job.model && <p>Model: {job.model}</p>}
                {job.gen_time_ms && <p>Time: {(job.gen_time_ms / 1000).toFixed(1)}s</p>}
                {job.seed && <p>Seed: {job.seed}</p>}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="space-y-2">
              {isCompleted ? (
                <>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRegenerate(job.id, undefined, false)}
                      className="flex-1 bg-white/90 border-mintari-lav text-mintari-ink hover:bg-mintari-lav/60 text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Regenerate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRegenerate(job.id, undefined, true)}
                      className="flex-1 bg-white/90 border-mintari-lav text-mintari-ink hover:bg-mintari-lav/60 text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Lock Seed
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onSaveToCollection(job.id)}
                      className="flex-1 bg-pink/20 border-pink/40 text-pink-dark hover:bg-pink/30 text-xs"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onDownload(job.id)}
                      className="flex-1 bg-sky/20 border-sky/40 text-sky-dark hover:bg-sky/30 text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onMintNFT(job.id)}
                      className="flex-1 bg-lavender/20 border-lavender/40 text-lavender-dark hover:bg-lavender/30 text-xs"
                    >
                      <Coins className="w-3 h-3 mr-1" />
                      Mint NFT
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onOrderFrame(job.id)}
                      className="flex-1 bg-peach/20 border-peach/40 text-peach-dark hover:bg-peach/30 text-xs"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Order Frame
                    </Button>
                  </div>
                </>
              ) : isFailed ? (
                <Button
                  size="sm"
                  onClick={() => onRegenerate(job.id)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              ) : (
                <div className="text-center py-2">
                  <p className="text-mintari-ink/60 text-xs">
                    {isPending ? 'Waiting in queue...' : 'Generating your image...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Render existing jobs */}
        {jobs.map(renderJobTile)}
        
        {/* Render skeleton tiles for pending generations */}
        {isGenerating && Array.from({ length: 3 }, (_, i) => renderSkeletonTile(i))}
      </div>
      
      {/* Empty state */}
      {jobs.length === 0 && !isGenerating && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-mintari-lav/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-mintari-lav text-2xl">🎨</span>
          </div>
          <h3 className="text-lg font-semibold text-mintari-ink mb-2">No generations yet</h3>
          <p className="text-mintari-ink/70">Upload a photo and start creating magical Ghibli art!</p>
        </div>
      )}
    </div>
  );
}
