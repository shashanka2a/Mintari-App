import { NextApiRequest, NextApiResponse } from 'next';
import { 
  ApiResponse, 
  ApiErrorResponse, 
  ApiErrorCode, 
  createSuccessResponse, 
  createErrorResponse 
} from '../types/api';

// API Wrapper for consistent error handling and typing
export function withApiHandler<TRequest = any, TResponse = any>(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<TResponse>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }

      // Execute the handler
      const result = await handler(req, res);
      
      // If handler already sent response, don't send again
      if (res.headersSent) {
        return;
      }

      // Send success response
      const successResponse = createSuccessResponse(result);
      res.status(200).json(successResponse);

    } catch (error: any) {
      console.error('API Error:', error);

      // If response already sent, don't send again
      if (res.headersSent) {
        return;
      }

      // Handle different types of errors
      let errorResponse: ApiErrorResponse;

      if (error.name === 'ValidationError') {
        errorResponse = createErrorResponse(
          error.message,
          ApiErrorCode.VALIDATION_ERROR,
          error.details
        );
        res.status(400).json(errorResponse);
      } else if (error.name === 'UnauthorizedError') {
        errorResponse = createErrorResponse(
          'Unauthorized access',
          ApiErrorCode.UNAUTHORIZED
        );
        res.status(401).json(errorResponse);
      } else if (error.name === 'ForbiddenError') {
        errorResponse = createErrorResponse(
          'Access forbidden',
          ApiErrorCode.FORBIDDEN
        );
        res.status(403).json(errorResponse);
      } else if (error.name === 'NotFoundError') {
        errorResponse = createErrorResponse(
          error.message || 'Resource not found',
          ApiErrorCode.NOT_FOUND
        );
        res.status(404).json(errorResponse);
      } else if (error.name === 'ConflictError') {
        errorResponse = createErrorResponse(
          error.message,
          ApiErrorCode.CONFLICT
        );
        res.status(409).json(errorResponse);
      } else {
        // Generic server error
        errorResponse = createErrorResponse(
          'Internal server error',
          ApiErrorCode.INTERNAL_ERROR,
          process.env.NODE_ENV === 'development' ? error.message : undefined
        );
        res.status(500).json(errorResponse);
      }
    }
  };
}

// Method-specific wrappers
export function withGet<TResponse = any>(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<TResponse>
) {
  return withApiHandler(async (req, res) => {
    if (req.method !== 'GET') {
      throw new Error('Method not allowed');
    }
    return await handler(req, res);
  });
}

export function withPost<TRequest = any, TResponse = any>(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<TResponse>
) {
  return withApiHandler(async (req, res) => {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }
    return await handler(req, res);
  });
}

export function withPut<TRequest = any, TResponse = any>(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<TResponse>
) {
  return withApiHandler(async (req, res) => {
    if (req.method !== 'PUT') {
      throw new Error('Method not allowed');
    }
    return await handler(req, res);
  });
}

export function withDelete<TResponse = any>(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<TResponse>
) {
  return withApiHandler(async (req, res) => {
    if (req.method !== 'DELETE') {
      throw new Error('Method not allowed');
    }
    return await handler(req, res);
  });
}

// Validation helpers
export function validateRequired(body: any, fields: string[]): void {
  const missing = fields.filter(field => !body[field]);
  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(', ')}`);
    error.name = 'ValidationError';
    throw error;
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const error = new Error('Invalid email format');
    error.name = 'ValidationError';
    throw error;
  }
}

export function validateEthereumAddress(address: string): void {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    const error = new Error('Invalid Ethereum address format');
    error.name = 'ValidationError';
    throw error;
  }
}

export function validateCollectionName(name: string): void {
  if (!name || name.length < 1 || name.length > 100) {
    const error = new Error('Collection name must be between 1 and 100 characters');
    error.name = 'ValidationError';
    throw error;
  }
}

export function validatePrompt(prompt: string): void {
  if (!prompt || prompt.length < 1 || prompt.length > 1000) {
    const error = new Error('Prompt must be between 1 and 1000 characters');
    error.name = 'ValidationError';
    throw error;
  }
}

// Authentication helpers
export function requireAuth(req: NextApiRequest): string {
  // In a real app, this would validate JWT tokens or session
  // For demo purposes, we'll use a simple header check
  const userId = req.headers['x-user-id'] as string;
  
  if (!userId) {
    const error = new Error('Authentication required');
    error.name = 'UnauthorizedError';
    throw error;
  }
  
  return userId;
}

// Database error handling
export function handleDatabaseError(error: any): never {
  console.error('Database error:', error);
  
  if (error.code === 'P2002') {
    // Unique constraint violation
    const error = new Error('Resource already exists');
    error.name = 'ConflictError';
    throw error;
  } else if (error.code === 'P2025') {
    // Record not found
    const error = new Error('Resource not found');
    error.name = 'NotFoundError';
    throw error;
  } else {
    // Generic database error
    const error = new Error('Database operation failed');
    error.name = 'DatabaseError';
    throw error;
  }
}

// File upload validation
export function validateFileUpload(file: any): void {
  if (!file) {
    const error = new Error('No file provided');
    error.name = 'ValidationError';
    throw error;
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    const error = new Error('File too large (max 5MB)');
    error.name = 'ValidationError';
    throw error;
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    const error = new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed');
    error.name = 'ValidationError';
    throw error;
  }
}

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): void {
  const now = Date.now();
  const key = identifier;
  const current = rateLimitMap.get(key);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return;
  }

  if (current.count >= maxRequests) {
    const error = new Error('Rate limit exceeded');
    error.name = 'RateLimitError';
    throw error;
  }

  current.count++;
}

// CORS helper
export function setCorsHeaders(res: NextApiResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}
