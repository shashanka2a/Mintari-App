import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

interface AddAssetRequest {
  collectionId: string;
  userId: string;
  url: string;
  prompt: string;
  seed?: number;
  model?: string;
  generationTimeMs?: number;
}

interface AssetResponse {
  id: string;
  collectionId: string;
  userId: string;
  url: string;
  prompt: string;
  seed?: number;
  model?: string;
  generationTimeMs?: number;
  createdAt: string;
  updatedAt: string;
}

// POST /api/assets - Add asset to collection
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AssetResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      collectionId, 
      userId, 
      url, 
      prompt, 
      seed, 
      model, 
      generationTimeMs 
    }: AddAssetRequest = req.body;

    // Validate required fields
    if (!collectionId || !userId || !url || !prompt) {
      return res.status(400).json({ 
        error: 'collectionId, userId, url, and prompt are required' 
      });
    }

    // Check if collection exists and user has access
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { userId: true },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (collection.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create asset
    const asset = await prisma.asset.create({
      data: {
        collectionId,
        userId,
        url: url.trim(),
        prompt: prompt.trim(),
        seed: seed || null,
        model: model || null,
        generationTimeMs: generationTimeMs || null,
      },
    });

    const response: AssetResponse = {
      id: asset.id,
      collectionId: asset.collectionId,
      userId: asset.userId,
      url: asset.url,
      prompt: asset.prompt,
      seed: asset.seed || undefined,
      model: asset.model || undefined,
      generationTimeMs: asset.generationTimeMs || undefined,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    };

    return res.status(201).json(response);

  } catch (error) {
    console.error('Assets API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
