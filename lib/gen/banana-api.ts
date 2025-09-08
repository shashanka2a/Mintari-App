import { ERROR_CODES, MODEL_INFO, type ErrorCode } from './constants';

// Banana API Request Shape
export interface BananaRequest {
  prompt: string;
  refImageUrl?: string;
  style: 'ghibli' | 'studio_ghibli' | 'anime' | 'fantasy' | 'whimsical';
  size: '1024x1024' | '512x512' | '768x768';
  seed?: number;
  negative_prompt?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
}

// Banana API Response Shape
export interface BananaResponse {
  imageB64: string;
  seed: number;
  model: string;
  durationMs: number;
  inference_time?: number;
  queue_time?: number;
}

// Banana API Error Response
export interface BananaErrorResponse {
  error: string;
  message?: string;
  code?: string;
  details?: any;
}

// Error mapping from Banana to app codes
export const mapBananaError = (error: BananaErrorResponse | string): ErrorCode => {
  const errorMessage = typeof error === 'string' ? error : error.error || error.message || '';
  const errorCode = typeof error === 'object' ? error.code : '';
  
  // Rate limiting
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests') || errorCode === '429') {
    return ERROR_CODES.RATE_LIMIT;
  }
  
  // Invalid prompt
  if (errorMessage.includes('invalid prompt') || errorMessage.includes('prompt too long') || errorCode === '400') {
    return ERROR_CODES.INVALID_PROMPT;
  }
  
  // Server errors
  if (errorMessage.includes('server error') || errorMessage.includes('internal error') || errorCode === '500') {
    return ERROR_CODES.SERVER_ERROR;
  }
  
  // Timeout
  if (errorMessage.includes('timeout') || errorMessage.includes('request timeout')) {
    return ERROR_CODES.TIMEOUT;
  }
  
  // Default to server error
  return ERROR_CODES.SERVER_ERROR;
};

// Banana API client
export class BananaAPIClient {
  private apiKey: string;
  private baseUrl: string;
  private modelKey: string;

  constructor() {
    this.apiKey = process.env.BANANA_API_KEY || '';
    this.baseUrl = process.env.BANANA_BASE_URL || 'https://api.banana.dev';
    this.modelKey = process.env.BANANA_MODEL_KEY || '';
    
    if (!this.apiKey || !this.modelKey) {
      throw new Error('Banana API credentials not configured');
    }
  }

  async generateImage(request: BananaRequest): Promise<BananaResponse> {
    const payload = {
      modelKey: this.modelKey,
      inputs: {
        prompt: request.prompt,
        negative_prompt: request.negative_prompt || 'blurry, low quality, distorted, extra limbs, missing limbs, deformed, watermark, text, signature, nsfw, inappropriate content',
        width: this.getSizeWidth(request.size),
        height: this.getSizeHeight(request.size),
        num_inference_steps: request.num_inference_steps || 20,
        guidance_scale: request.guidance_scale || 7.5,
        seed: request.seed || -1, // -1 for random seed
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/start/v4`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Banana API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      
      // Extract the call ID for polling
      const callID = result.id;
      
      // Poll for completion
      return await this.pollForCompletion(callID);
      
    } catch (error) {
      console.error('Banana API call failed:', error);
      throw error;
    }
  }

  private async pollForCompletion(callID: string, maxAttempts = 30, intervalMs = 2000): Promise<BananaResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/check/v4`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({ id: callID }),
        });

        if (!response.ok) {
          throw new Error(`Polling error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.finished) {
          if (result.success) {
            const modelOutputs = result.modelOutputs?.[0];
            if (!modelOutputs || !modelOutputs.image) {
              throw new Error('No image in Banana response');
            }

            return {
              imageB64: modelOutputs.image,
              seed: modelOutputs.seed || Math.floor(Math.random() * 1000000),
              model: MODEL_INFO.NAME,
              durationMs: result.finishedAt - result.startedAt,
              inference_time: modelOutputs.inference_time,
              queue_time: result.queue_time,
            };
          } else {
            throw new Error(result.message || 'Banana generation failed');
          }
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error('Generation timeout - exceeded maximum polling attempts');
  }

  private getSizeWidth(size: string): number {
    const [width] = size.split('x').map(Number);
    return width;
  }

  private getSizeHeight(size: string): number {
    const [, height] = size.split('x').map(Number);
    return height;
  }
}

// Export singleton instance
export const bananaAPI = new BananaAPIClient();
