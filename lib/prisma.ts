import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Prisma middleware for common operations
prisma.$use(async (params, next) => {
  // Log queries in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Query:', params.model, params.action, params.args)
  }
  
  // Add timestamps for create/update operations
  if (params.action === 'create') {
    params.args.data.createdAt = new Date()
    params.args.data.updatedAt = new Date()
  }
  
  if (params.action === 'update' || params.action === 'updateMany') {
    params.args.data.updatedAt = new Date()
  }
  
  return next(params)
})

// Helper functions for common queries
export const prismaHelpers = {
  // User helpers
  async getUserWithRelations(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        uploads: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        collections: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        preferences: true
      }
    })
  },

  // Upload helpers
  async getUserUploads(userId: string, limit = 20, offset = 0) {
    return prisma.upload.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        aiGenerations: {
          include: {
            generatedImages: true
          }
        }
      }
    })
  },

  // Collection helpers
  async getUserCollections(userId: string, includePublic = false) {
    return prisma.collection.findMany({
      where: {
        OR: [
          { userId },
          ...(includePublic ? [{ isPublic: true }] : [])
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            upload: true,
            generatedImage: true
          }
        }
      }
    })
  },

  // Generation helpers
  async getGenerationWithImages(generationId: string) {
    return prisma.aIGeneration.findUnique({
      where: { id: generationId },
      include: {
        upload: true,
        generatedImages: {
          orderBy: { generationVariant: 'asc' }
        }
      }
    })
  },

  // Analytics helpers
  async trackEvent(eventData: {
    userId?: string
    eventType: string
    screenName?: string
    eventData?: any
    sessionId?: string
  }) {
    return prisma.appAnalytics.create({
      data: {
        userId: eventData.userId,
        eventType: eventData.eventType,
        screenName: eventData.screenName,
        eventData: eventData.eventData,
        sessionId: eventData.sessionId,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
        ipAddress: null // Will be set by server-side middleware
      }
    })
  },

  // NFT helpers
  async getUserNFTMintings(userId: string) {
    return prisma.nFTMinting.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        generatedImage: {
          include: {
            generation: {
              include: {
                upload: true
              }
            }
          }
        }
      }
    })
  },

  // Order helpers
  async getUserOrders(userId: string) {
    return prisma.physicalOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        generatedImage: {
          include: {
            generation: {
              include: {
                upload: true
              }
            }
          }
        },
        paymentMethod: true
      }
    })
  },

  // Search helpers
  async searchCollections(query: string, userId?: string) {
    return prisma.collection.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          },
          {
            OR: [
              { userId },
              { isPublic: true }
            ]
          }
        ]
      },
      include: {
        items: {
          include: {
            upload: true,
            generatedImage: true
          }
        }
      }
    })
  },

  // Statistics helpers
  async getUserStats(userId: string) {
    const [
      uploadCount,
      generationCount,
      collectionCount,
      nftCount,
      orderCount
    ] = await Promise.all([
      prisma.upload.count({ where: { userId } }),
      prisma.aIGeneration.count({ where: { userId } }),
      prisma.collection.count({ where: { userId } }),
      prisma.nFTMinting.count({ where: { userId } }),
      prisma.physicalOrder.count({ where: { userId } })
    ])

    return {
      uploads: uploadCount,
      generations: generationCount,
      collections: collectionCount,
      nfts: nftCount,
      orders: orderCount
    }
  }
}

// Database connection health check
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'connected', timestamp: new Date() }
  } catch (error) {
    return { status: 'disconnected', error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date() }
  }
}

// Graceful shutdown
export async function disconnectPrisma() {
  await prisma.$disconnect()
}

// Export types
export type PrismaClientType = typeof prisma
