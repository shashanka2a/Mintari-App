import { BASE_PROMPTS, SAFETY_PROMPTS, BANNED_CONTENT, GENERATION_STYLES, type GenerationStyle } from './constants';
import crypto from 'crypto';

// Content safety check
export function checkContentSafety(prompt: string): { isSafe: boolean; reason?: string } {
  const lowerPrompt = prompt.toLowerCase();
  
  for (const bannedWord of BANNED_CONTENT) {
    if (lowerPrompt.includes(bannedWord)) {
      return {
        isSafe: false,
        reason: `Content contains restricted term: ${bannedWord}`
      };
    }
  }
  
  return { isSafe: true };
}

// Normalize prompt for hashing (remove extra whitespace, normalize case)
export function normalizePrompt(prompt: string): string {
  return prompt
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .toLowerCase();
}

// Generate prompt hash for deduplication
export function generatePromptHash(prompt: string): string {
  const normalized = normalizePrompt(prompt);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Assemble final prompt with base style, user prompt, and safety prompts
export function assemblePrompt(
  userPrompt: string,
  style: GenerationStyle = GENERATION_STYLES.GHIBLI,
  includeSafety: boolean = true
): string {
  // Check content safety first
  const safetyCheck = checkContentSafety(userPrompt);
  if (!safetyCheck.isSafe) {
    throw new Error(`SAFETY_VIOLATION: ${safetyCheck.reason}`);
  }

  // Get base prompt for the style
  const basePrompt = BASE_PROMPTS[style];
  
  // Clean and prepare user prompt
  const cleanUserPrompt = userPrompt.trim();
  
  // Assemble the final prompt
  let finalPrompt = basePrompt + ' ' + cleanUserPrompt;
  
  if (includeSafety) {
    finalPrompt += ' ' + SAFETY_PROMPTS.POSITIVE + ' ' + SAFETY_PROMPTS.COMPOSITION;
  }
  
  return finalPrompt.trim();
}

// Generate negative prompt
export function generateNegativePrompt(): string {
  return SAFETY_PROMPTS.NEGATIVE;
}

// Extract seed from prompt or generate random
export function extractOrGenerateSeed(prompt: string, lockSeed: boolean = false): number {
  if (lockSeed) {
    // Use prompt hash to generate consistent seed
    const hash = generatePromptHash(prompt);
    return parseInt(hash.substring(0, 8), 16) % 1000000;
  }
  
  // Generate random seed
  return Math.floor(Math.random() * 1000000);
}

// Validate prompt length and content
export function validatePrompt(prompt: string): { isValid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { isValid: false, error: 'Prompt cannot be empty' };
  }
  
  if (prompt.length > 1000) {
    return { isValid: false, error: 'Prompt too long (max 1000 characters)' };
  }
  
  if (prompt.length < 3) {
    return { isValid: false, error: 'Prompt too short (min 3 characters)' };
  }
  
  return { isValid: true };
}

// Parse prompt delta for regeneration
export function parsePromptDelta(originalPrompt: string, delta: string): string {
  if (!delta || delta.trim() === '') {
    return originalPrompt;
  }
  
  // Simple delta application - in a real app, you might want more sophisticated merging
  const cleanDelta = delta.trim();
  
  // If delta starts with +, append to original
  if (cleanDelta.startsWith('+')) {
    return originalPrompt + ' ' + cleanDelta.substring(1);
  }
  
  // If delta starts with -, remove from original
  if (cleanDelta.startsWith('-')) {
    const toRemove = cleanDelta.substring(1).trim();
    return originalPrompt.replace(new RegExp(toRemove, 'gi'), '').trim();
  }
  
  // Otherwise, replace original with delta
  return cleanDelta;
}

// Style validation
export function validateStyle(style: string): style is GenerationStyle {
  return Object.values(GENERATION_STYLES).includes(style as GenerationStyle);
}

// Size validation
export function validateSize(size: string): boolean {
  const validSizes = ['1024x1024', '512x512', '768x768'];
  return validSizes.includes(size);
}
