// AI Generation Constants
export const GENERATION_CONFIG = {
  // Image dimensions
  SIZES: {
    '1024x1024': { width: 1024, height: 1024 },
    '512x512': { width: 512, height: 512 },
    '768x768': { width: 768, height: 768 },
  },
  
  // Default size
  DEFAULT_SIZE: '1024x1024' as const,
  
  // Maximum variants per generation
  MAX_VARIANTS: parseInt(process.env.GEN_MAX_VARIANTS || '3'),
  
  // Generation timeout
  TIMEOUT_MS: parseInt(process.env.GEN_TIMEOUT_MS || '60000'),
  
  // Rate limiting
  RATE_LIMIT: {
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'),
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  },
} as const;

// Generation styles
export const GENERATION_STYLES = {
  GHIBLI: 'ghibli',
  STUDIO_GHIBLI: 'studio_ghibli',
  ANIME: 'anime',
  FANTASY: 'fantasy',
  WHIMSICAL: 'whimsical',
} as const;

export type GenerationStyle = typeof GENERATION_STYLES[keyof typeof GENERATION_STYLES];

// Base prompts for different styles
export const BASE_PROMPTS = {
  [GENERATION_STYLES.GHIBLI]: 'Studio Ghibli style, hand-drawn animation, soft watercolor textures, magical atmosphere, detailed backgrounds, warm lighting,',
  [GENERATION_STYLES.STUDIO_GHIBLI]: 'Studio Ghibli animation style, cel-shaded, vibrant colors, detailed character design, fantastical elements,',
  [GENERATION_STYLES.ANIME]: 'Anime style, clean line art, vibrant colors, expressive characters, detailed backgrounds,',
  [GENERATION_STYLES.FANTASY]: 'Fantasy art style, magical elements, ethereal lighting, detailed textures, whimsical atmosphere,',
  [GENERATION_STYLES.WHIMSICAL]: 'Whimsical art style, playful colors, soft textures, magical elements, dreamy atmosphere,',
} as const;

// Safety and composition prompts
export const SAFETY_PROMPTS = {
  POSITIVE: 'high quality, detailed, beautiful, artistic,',
  NEGATIVE: 'blurry, low quality, distorted, extra limbs, missing limbs, deformed, watermark, text, signature, nsfw, inappropriate content,',
  COMPOSITION: 'well-composed, balanced, aesthetically pleasing,',
} as const;

// Job states
export const JOB_STATES = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type JobState = typeof JOB_STATES[keyof typeof JOB_STATES];

// Progress checkpoints
export const PROGRESS_CHECKPOINTS = {
  QUEUED: 0,
  PREPROCESS: 10,
  BANANA_CALL_START: 20,
  BANANA_CALL_END: 90,
  UPLOAD: 95,
  DONE: 100,
} as const;

// Error codes mapping
export const ERROR_CODES = {
  RATE_LIMIT: 'RATE_LIMIT',
  INVALID_PROMPT: 'INVALID_PROMPT',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
  SAFETY_VIOLATION: 'SAFETY_VIOLATION',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  BANANA_ERROR: 'BANANA_ERROR',
  UPLOAD_ERROR: 'UPLOAD_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Content safety - banned words/phrases
export const BANNED_CONTENT = [
  'nsfw', 'nude', 'naked', 'sexual', 'explicit', 'porn', 'adult',
  'violence', 'blood', 'gore', 'weapon', 'gun', 'knife',
  'hate', 'racist', 'discrimination', 'offensive',
  'illegal', 'drug', 'alcohol', 'smoking',
  'copyright', 'trademark', 'brand', 'logo',
];

// Retry configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 2,
  BACKOFF_DELAYS: [2000, 5000], // 2s, 5s
} as const;

// Model information
export const MODEL_INFO = {
  NAME: 'stable-diffusion-xl',
  VERSION: '1.0',
  PROVIDER: 'banana',
} as const;
