import { ERROR_CODES, MODEL_INFO, type ErrorCode } from './constants';

// Google Gemini API Request Shape
export interface GeminiRequest {
  prompt: string;
  refImageUrl?: string;
  style: 'ghibli' | 'studio_ghibli' | 'anime' | 'fantasy' | 'whimsical';
  size: '1024x1024' | '512x512' | '768x768';
  seed?: number;
  negative_prompt?: string;
}

// Google Gemini API Response Shape
export interface GeminiResponse {
  imageB64: string;
  seed: number;
  model: string;
  durationMs: number;
  inference_time?: number;
  queue_time?: number;
}

// Google Gemini API Error Response
export interface GeminiErrorResponse {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

// Error mapping from Gemini to app codes
export const mapGeminiError = (error: GeminiErrorResponse | string): ErrorCode => {
  const errorMessage = typeof error === 'string' ? error : error.error?.message || '';
  const errorCode = typeof error === 'object' ? error.error?.code : 0;
  
  // Rate limiting
  if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorCode === 429) {
    return ERROR_CODES.RATE_LIMIT;
  }
  
  // Invalid prompt
  if (errorMessage.includes('invalid') || errorMessage.includes('prompt') || errorCode === 400) {
    return ERROR_CODES.INVALID_PROMPT;
  }
  
  // Server errors
  if (errorMessage.includes('server') || errorMessage.includes('internal') || errorCode >= 500) {
    return ERROR_CODES.SERVER_ERROR;
  }
  
  // Default to server error
  return ERROR_CODES.SERVER_ERROR;
};

// Google Gemini API client
export class GoogleGeminiAPIClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY || '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = process.env.GOOGLE_GEMINI_MODEL || 'gemini-1.5-flash';
    
    if (!this.apiKey) {
      throw new Error('Google API key not configured');
    }
  }

  async generateImage(request: GeminiRequest): Promise<GeminiResponse> {
    const startTime = Date.now();
    
    try {
      // Create the prompt for image generation
      const enhancedPrompt = this.createEnhancedPrompt(request);
      
      // For now, we'll use a text-to-image approach with Gemini
      // Note: Gemini 1.5 Flash doesn't directly generate images, but we can use it for prompt enhancement
      // and then use a different approach or service for actual image generation
      
      const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Create a detailed prompt for generating a Studio Ghibli style artwork based on this description: "${enhancedPrompt}". The prompt should be optimized for AI image generation and include specific artistic details, lighting, composition, and style elements that would create a beautiful Studio Ghibli-inspired piece.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Google Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      
      if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      const generatedPrompt = result.candidates[0].content.parts[0].text;
      
      // For demonstration, we'll return a placeholder image URL
      // In a real implementation, you would use this enhanced prompt with an image generation service
      const placeholderImageUrl = this.generatePlaceholderImage(generatedPrompt, request);
      
      return {
        imageB64: placeholderImageUrl,
        seed: request.seed || Math.floor(Math.random() * 1000000),
        model: this.model,
        durationMs: Date.now() - startTime,
        inference_time: Date.now() - startTime,
      };
      
    } catch (error) {
      console.error('Google Gemini API call failed:', error);
      throw error;
    }
  }

  private createEnhancedPrompt(request: GeminiRequest): string {
    const basePrompts = {
      ghibli: 'Studio Ghibli style, hand-drawn animation, soft watercolor textures, magical atmosphere, detailed backgrounds, warm lighting,',
      studio_ghibli: 'Studio Ghibli animation style, cel-shaded, vibrant colors, detailed character design, fantastical elements,',
      anime: 'Anime style, clean line art, vibrant colors, expressive characters, detailed backgrounds,',
      fantasy: 'Fantasy art style, magical elements, ethereal lighting, detailed textures, whimsical atmosphere,',
      whimsical: 'Whimsical art style, playful colors, soft textures, magical elements, dreamy atmosphere,',
    };

    const stylePrompt = basePrompts[request.style] || basePrompts.ghibli;
    const negativePrompt = request.negative_prompt || 'blurry, low quality, distorted, extra limbs, missing limbs, deformed, watermark, text, signature, nsfw, inappropriate content';
    
    return `${stylePrompt} ${request.prompt}, high quality, detailed, beautiful, artistic, well-composed, balanced, aesthetically pleasing. Negative: ${negativePrompt}`;
  }

  private generatePlaceholderImage(prompt: string, request: GeminiRequest): string {
    // For now, return a placeholder image URL
    // In a real implementation, you would:
    // 1. Use the enhanced prompt with an image generation service like DALL-E, Midjourney, or Stable Diffusion
    // 2. Or use Google's Imagen API if available
    // 3. Or integrate with another image generation service
    
    const placeholderImages = [
      "https://images.unsplash.com/photo-1610114586897-20495783e96c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkaW8lMjBnaGlibGklMjBhbmltZSUyMHN0eWxlJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc1NzI4OTUyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      "https://images.unsplash.com/photo-1618298363483-e31a31f1a1e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBob3RvZ3JhcGh5JTIwcGVyc29uJTIwc21pbGluZ3xlbnwxfHx8fDE3NTcyODk1Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      "https://images.unsplash.com/photo-1610114586897-20495783e96c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkaW8lMjBnaGlibGklMjBhbmltZSUyMHN0eWxlJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc1NzI4OTUyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    ];
    
    // Return a random placeholder based on the seed
    const index = (request.seed || Math.floor(Math.random() * 1000000)) % placeholderImages.length;
    return placeholderImages[index];
  }
}

// Export singleton instance
export const geminiAPI = new GoogleGeminiAPIClient();
