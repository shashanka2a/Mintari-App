// API Response Types for Mintari App
// Ensures all API endpoints return consistent, typed JSON responses

// Base API Response Interface
export interface BaseApiResponse {
  success: boolean;
  error?: string;
  errorCode?: string;
  timestamp?: string;
}

// Success Response Interface
export interface ApiSuccessResponse<T = any> extends BaseApiResponse {
  success: true;
  data: T;
}

// Error Response Interface
export interface ApiErrorResponse extends BaseApiResponse {
  success: false;
  error: string;
  errorCode: string;
  details?: any;
}

// Union type for all API responses
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Collection Types
export interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  publicSlug?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  assets?: Asset[];
  _count?: {
    assets: number;
  };
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

// Asset Types
export interface Asset {
  id: string;
  url: string;
  prompt: string;
  seed?: number;
  model?: string;
  generationTimeMs?: number;
  userId: string;
  collectionId?: string;
  createdAt: string;
  updatedAt: string;
  collection?: Collection;
}

export interface CreateAssetRequest {
  url: string;
  prompt: string;
  seed?: number;
  model?: string;
  generationTimeMs?: number;
  collectionId?: string;
}

export interface UpdateAssetRequest {
  prompt?: string;
  collectionId?: string;
}

// Upload Types
export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// Generation Types
export interface GenerationRequest {
  prompt: string;
  style?: string;
  seed?: number;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
}

export interface GenerationResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  estimatedTime?: number;
  message?: string;
}

export interface GenerationStatusResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: {
    url: string;
    seed: number;
    generationTimeMs: number;
  };
  error?: string;
  estimatedTimeRemaining?: number;
}

// Minting Types
export interface MintRequest {
  assetIds: string[];
  userAddress: string;
  userId: string;
}

export interface MintResponse {
  success: boolean;
  transactionHashes?: string[];
  error?: string;
  errorCode?: string;
}

// NFT Minting Record Types
export interface NFTMinting {
  id: string;
  userId: string;
  assetId: string;
  tokenId: string;
  contractAddress: string;
  transactionHash: string;
  metadataURI: string;
  mintStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  mintedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User Types
export interface User {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  walletAddress?: string;
  createdAt: string;
  updatedAt: string;
}

// Public Collection Types
export interface PublicCollectionResponse {
  collection: Collection;
  assets: Asset[];
  owner: {
    username?: string;
    fullName?: string;
  };
}

// Error Codes
export enum ApiErrorCode {
  // General Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  
  // Upload Errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  
  // Generation Errors
  GENERATION_FAILED = 'GENERATION_FAILED',
  GENERATION_TIMEOUT = 'GENERATION_TIMEOUT',
  INVALID_PROMPT = 'INVALID_PROMPT',
  
  // Collection Errors
  COLLECTION_NOT_FOUND = 'COLLECTION_NOT_FOUND',
  COLLECTION_ACCESS_DENIED = 'COLLECTION_ACCESS_DENIED',
  COLLECTION_NAME_EXISTS = 'COLLECTION_NAME_EXISTS',
  
  // Asset Errors
  ASSET_NOT_FOUND = 'ASSET_NOT_FOUND',
  ASSET_ACCESS_DENIED = 'ASSET_ACCESS_DENIED',
  
  // Minting Errors
  MINTING_FAILED = 'MINTING_FAILED',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  BATCH_SIZE_EXCEEDED = 'BATCH_SIZE_EXCEEDED',
  ASSETS_NOT_FOUND = 'ASSETS_NOT_FOUND',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  INSUFFICIENT_GAS = 'INSUFFICIENT_GAS',
  
  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
}

// API Response Helpers
export function createSuccessResponse<T>(data: T): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(
  error: string,
  errorCode: ApiErrorCode,
  details?: any
): ApiErrorResponse {
  return {
    success: false,
    error,
    errorCode,
    details,
    timestamp: new Date().toISOString(),
  };
}

// Validation Helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidCollectionName(name: string): boolean {
  return name.length >= 1 && name.length <= 100;
}

export function isValidPrompt(prompt: string): boolean {
  return prompt.length >= 1 && prompt.length <= 1000;
}

// API Route Handler Type
export type ApiHandler<TRequest = any, TResponse = any> = (
  req: any,
  res: any
) => Promise<void>;

// Middleware Types
export interface ApiMiddleware {
  (req: any, res: any, next: () => void): void | Promise<void>;
}

// Request Validation Types
export interface ValidationSchema {
  body?: any;
  query?: any;
  params?: any;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Search Types
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  pagination?: PaginationParams;
}

export interface SearchResponse<T> {
  results: T[];
  total: number;
  query: string;
  filters: Record<string, any>;
  pagination: PaginatedResponse<T>['pagination'];
}
