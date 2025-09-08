import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { generateSlug } from '../../../lib/utils/slug';

const prisma = new PrismaClient();

interface UpdateCollectionRequest {
  title?: string;
  description?: string;
  style?: string;
  isPublic?: boolean;
  userId: string;
}

interface CollectionDetailResponse {
  id: string;
  title: string;
  description?: string;
  style: string;
  isPublic: boolean;
  publicSlug?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    title: string;
    description?: string;
    tags: string[];
    isFavorite: boolean;
    createdAt: string;
    upload: {
      id: string;
      originalFilename: string;
      filePath: string;
    };
    generatedImage: {
      id: string;
      imageUrl: string;
      thumbnailUrl?: string;
    };
  }>;
  assets: Array<{
    id: string;
    url: string;
    prompt: string;
    seed?: number;
    model?: string;
    generationTimeMs?: number;
    createdAt: string;
  }>;
  _count: {
    items: number;
    assets: number;
  };
}

// GET /api/collections/[id] - Get collection details
// PUT /api/collections/[id] - Update collection
// DELETE /api/collections/[id] - Delete collection
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CollectionDetailResponse | { error: string }>
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Collection ID is required' });
  }

  try {
    // GET - Get collection details
    if (req.method === 'GET') {
      const collection = await prisma.collection.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              upload: {
                select: {
                  id: true,
                  originalFilename: true,
                  filePath: true,
                },
              },
              generatedImage: {
                select: {
                  id: true,
                  imageUrl: true,
                  thumbnailUrl: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          assets: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              items: true,
              assets: true,
            },
          },
        },
      });

      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      const response: CollectionDetailResponse = {
        id: collection.id,
        title: collection.title,
        description: collection.description || undefined,
        style: collection.style,
        isPublic: collection.isPublic,
        publicSlug: collection.publicSlug || undefined,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
        items: collection.items.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || undefined,
          tags: item.tags,
          isFavorite: item.isFavorite,
          createdAt: item.createdAt.toISOString(),
          upload: item.upload,
          generatedImage: item.generatedImage,
        })),
        assets: collection.assets.map(asset => ({
          id: asset.id,
          url: asset.url,
          prompt: asset.prompt,
          seed: asset.seed || undefined,
          model: asset.model || undefined,
          generationTimeMs: asset.generationTimeMs || undefined,
          createdAt: asset.createdAt.toISOString(),
        })),
        _count: collection._count,
      };

      return res.status(200).json(response);
    }

    // PUT - Update collection
    if (req.method === 'PUT') {
      const { title, description, style, isPublic, userId }: UpdateCollectionRequest = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Check if user owns the collection
      const existingCollection = await prisma.collection.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!existingCollection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      if (existingCollection.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Prepare update data
      const updateData: any = {};
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (style !== undefined) updateData.style = style;
      if (isPublic !== undefined) {
        updateData.isPublic = isPublic;
        
        // Generate or remove public slug
        if (isPublic && !existingCollection.publicSlug) {
          updateData.publicSlug = await generateUniqueSlug(title || existingCollection.title);
        } else if (!isPublic) {
          updateData.publicSlug = null;
        }
      }

      const updatedCollection = await prisma.collection.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              items: true,
              assets: true,
            },
          },
        },
      });

      const response: CollectionDetailResponse = {
        id: updatedCollection.id,
        title: updatedCollection.title,
        description: updatedCollection.description || undefined,
        style: updatedCollection.style,
        isPublic: updatedCollection.isPublic,
        publicSlug: updatedCollection.publicSlug || undefined,
        createdAt: updatedCollection.createdAt.toISOString(),
        updatedAt: updatedCollection.updatedAt.toISOString(),
        items: [],
        assets: [],
        _count: updatedCollection._count,
      };

      return res.status(200).json(response);
    }

    // DELETE - Delete collection
    if (req.method === 'DELETE') {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Check if user owns the collection
      const existingCollection = await prisma.collection.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!existingCollection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      if (existingCollection.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Delete collection (cascade will handle related records)
      await prisma.collection.delete({
        where: { id },
      });

      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Collection detail API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Generate unique slug for public collections
async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.collection.findUnique({
      where: { publicSlug: slug },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
