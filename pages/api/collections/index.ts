import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { generateSlug } from '../../../lib/utils/slug';

const prisma = new PrismaClient();

interface CreateCollectionRequest {
  title: string;
  description?: string;
  style?: string;
  isPublic?: boolean;
  userId: string;
}

interface CollectionResponse {
  id: string;
  title: string;
  description?: string;
  style: string;
  isPublic: boolean;
  publicSlug?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    items: number;
    assets: number;
  };
}

// GET /api/collections - List collections for a user
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CollectionResponse[] | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      const { userId, style } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Build where clause
      const where: any = { userId };
      if (style && typeof style === 'string') {
        where.style = style;
      }

      const collections = await prisma.collection.findMany({
        where,
        include: {
          _count: {
            select: {
              items: true,
              assets: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const response: CollectionResponse[] = collections.map(collection => ({
        id: collection.id,
        title: collection.title,
        description: collection.description || undefined,
        style: collection.style,
        isPublic: collection.isPublic,
        publicSlug: collection.publicSlug || undefined,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
        _count: collection._count,
      }));

      return res.status(200).json(response);

    } catch (error) {
      console.error('Collections GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/collections - Create a new collection
  if (req.method === 'POST') {
    try {
      const { title, description, style = 'ghibli', isPublic = false, userId }: CreateCollectionRequest = req.body;

      if (!title || !userId) {
        return res.status(400).json({ error: 'title and userId are required' });
      }

      // Generate unique public slug if collection is public
      let publicSlug: string | undefined;
      if (isPublic) {
        publicSlug = await generateUniqueSlug(title);
      }

      const collection = await prisma.collection.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          style,
          isPublic,
          publicSlug,
          userId,
        },
        include: {
          _count: {
            select: {
              items: true,
              assets: true,
            },
          },
        },
      });

      const response: CollectionResponse = {
        id: collection.id,
        title: collection.title,
        description: collection.description || undefined,
        style: collection.style,
        isPublic: collection.isPublic,
        publicSlug: collection.publicSlug || undefined,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
        _count: collection._count,
      };

      return res.status(201).json(response);

    } catch (error) {
      console.error('Collections POST error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
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
